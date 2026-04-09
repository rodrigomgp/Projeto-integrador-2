const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');

async function iniciar() {
    console.log("Iniciando sistema...");
    const { state, saveCreds } = await useMultiFileAuthState('auth_nova');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        // Reduz os logs no terminal para economizar memória
        logger: pino({ level: 'silent' }), 
        browser: ["Windows", "Chrome", "122.0.6261.112"],
        syncFullHistory: false 
    });

    sock.ev.on('creds.update', saveCreds);

    // Monitora a conexão
    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;
        
        if (qr) {
            console.clear();
            console.log(">>> ESCANEIE O QR CODE <<<");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log("✅ BOT CONECTADO E PRONTO PARA RESPONDER!");
        }

        if (connection === 'close') {
            const deveReconectar = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log("Conexão fechada. Reconectando...", deveReconectar);
            if (deveReconectar) iniciar();
        }
    });

    // --- ESSA É A PARTE QUE FALTAVA: ESCUTAR MENSAGENS ---
    sock.ev.on('messages.upsert', async m => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe || m.type !== 'notify') return;

    const jid = msg.key.remoteJid;

    // --- ESSA É A TRAVA DE GRUPO ---
    if (jid.endsWith('@g.us')) return; // Se a mensagem for de grupo, o bot para aqui e não responde.
    // -------------------------------

    const nome = msg.pushName || "Usuário";
    const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

    console.log(`📩 Mensagem PRIVADA de ${nome}: ${texto}`);

    await sock.sendMessage(jid, { text: `Olá, ${nome}! Agora só respondo no privado. 🤖` });
});
}

iniciar().catch(err => console.log("Erro ao iniciar:", err));