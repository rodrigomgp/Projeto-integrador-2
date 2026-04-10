const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL; 
const supabaseKey = process.env.SUPABASE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

async function iniciar() {
    console.log("🚀 Iniciando sistema: WhatsApp + Supabase...");

    const { state, saveCreds } = await useMultiFileAuthState('auth_nova');
    const { version } = await fetchLatestBaileysVersion(); 

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        browser: ["Windows", "Chrome", "122.0.6261.112"],
        syncFullHistory: false, 
        logger: require('pino')({ level: 'silent' }) 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.clear();
            console.log("📌 ESCANEIE O QR CODE:");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') {
            console.log("\n✅ BOT ONLINE!");
        }
        if (connection === 'close') {
            const reason = lastDisconnect?.error?.output?.statusCode;
            if (reason !== DisconnectReason.loggedOut) iniciar();
        }
    });

    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];

        // 1. TRAVA DE SEGURANÇA: Verifica se a estrutura básica existe
        if (!msg.message || msg.key.fromMe) return;

        // 2. FILTRO DE TEXTO: Tenta capturar o texto com segurança
        const texto = msg.message.conversation || 
                      msg.message.extendedTextMessage?.text || 
                      msg.message.imageMessage?.caption || "";

        if (!texto || texto.trim() === "") {
            // Ignora se for apenas figurinha, áudio ou aviso de sistema sem legenda
            return;
        }

        const jid = msg.key.remoteJid;
        if (jid.endsWith('@g.us')) return; 

        // 3. FILTRO DE TEMPO
        const agora = Math.floor(Date.now() / 1000);
        const tempoMsg = msg.messageTimestamp;
        if (agora - tempoMsg > 120) return;

        // 4. IDENTIFICAÇÃO
        const nome = msg.pushName || "Usuário Desconhecido";
        let numero = jid.split('@')[0].split(':')[0];

        // Se for LID longo
        if (numero.length > 15 && msg.key.participant) {
            numero = msg.key.participant.split('@')[0].split(':')[0];
        }

        console.log(`\n📩 Mensagem de ${nome} (${numero}): "${texto}"`);

        // 5. BANCO DE DADOS
        try {
            const { error } = await supabase
                .from('usuarios')
                .upsert({ numero: numero, nome: nome }, { onConflict: 'numero' });

            if (error) {
                console.log("❌ Erro Supabase:", error.message);
            } else {
                console.log("✅ Salvo no Banco.");
                await sock.sendMessage(jid, { 
                    text: `Olá, ${nome}! Registrei seu contato (${numero}) no meu banco de dados. 🤖` 
                });
            }
        } catch (e) {
            console.log("❌ Erro na lógica:", e.message);
        }
    });
}

iniciar();