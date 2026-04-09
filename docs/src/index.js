const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');

async function iniciar() {
    console.log("Tentando conexão limpa...");
    const { state, saveCreds } = await useMultiFileAuthState('auth_nova');
    const { version } = await fetchLatestBaileysVersion(); 

    const sock = makeWASocket({
        auth: state,
        version,
        printQRInTerminal: false,
        browser: ["Windows", "Chrome", "122.0.6261.112"],
        syncFullHistory: false,
        // SILENCIAR CODIGOS NÃO PERTINENTES
        logger: require('pino')({ level: 'silent' }) 
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, qr, lastDisconnect } = update;
        if (qr) {
            console.clear();
            console.log(">>> ESCANEIE O QR CODE ABAIXO <<<");
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') console.log("✅ BOT ONLINE E AGUARDANDO MENSAGENS!");
        if (connection === 'close') {
            console.log("Conexão fechada. Tentando reconectar...");
            setTimeout(iniciar, 5000);
        }
    });

    // ENTENDENDO AS MENSAGENS
    sock.ev.on('messages.upsert', async m => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe || m.type !== 'notify') return;

        const jid = msg.key.remoteJid;
        if (jid.endsWith('@g.us')) return; // IGNORA OS GRUPOS

        const nome = msg.pushName || "Usuário";
        const texto = msg.message.conversation || msg.message.extendedTextMessage?.text || "";

        console.log(`📩 Mensagem de ${nome}: ${texto}`);

        // RESPOSTA AUTOMATICA
        await sock.sendMessage(jid, { text: `Olá, ${nome}! Recebi sua mensagem: "${texto}". O Carlos está me configurando! 🤖` });
    });
}

iniciar();