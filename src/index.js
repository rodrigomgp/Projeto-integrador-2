const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion, downloadMediaMessage } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const pino = require('pino');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// Configuração Supabase(Banco de dados)
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function connectToWhatsApp() {
    // Passo 1: Inicializamos o gerenciador de sessão nativo do Baileys. 
    // Ele cria a pastinha 'sessao_final' para armazenar os tokens de acesso de modo seguro,
    // evitando que o bot peça para escanear o QR Code toda vez que você der um restart.
    const { state, saveCreds } = await useMultiFileAuthState('sessao_final');

    // Passo 2: Buscamos de forma contínua e inteligente a versão mais recente do WhatsApp.
    // Isso é vital para que o bot não fique engasgando ou sofrendo com mensagens defasadas.
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`📡 Usando a versão do WhatsApp Web: v${version.join('.')} (Mais recente: ${isLatest})`);

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }), // Deixamos o terminal limpo silenciando a enxurrada de logs do Baileys
        version,
        auth: state,
        printQRInTerminal: false,
        mobile: false,
        browser: ["Ubuntu", "Chrome", "20.0.04"],
        syncFullHistory: false,
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 0,
        keepAliveIntervalMs: 10000
    });


    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            const qrcode = require('qrcode-terminal');
            console.log('\n📌 ESCANEIE O QR CODE PARA CONECTAR O BOT:');
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'close') {
            const statusCode = lastDisconnect?.error?.output?.statusCode;
            const deveReconectar = statusCode !== 401 && statusCode !== 405;

            console.log(`⚠️ Conexão fechada. Status: ${statusCode}. Reconectando: ${deveReconectar}`);

            if (deveReconectar) {
                connectToWhatsApp();
            } else {
                // Se a falha foi drástica (Ex: o usuário removeu o bot pelo celular), orientamos
                // o desenvolvedor a resetar a pasta de modo limpo em vez de forçar laços infinitos.
                console.log('❌ Erro crítico de sessão. Apague a pasta sessao_limpa e tente novamente.');
            }
        } else if (connection === 'open') {
            console.log('✅ BOT HV SOLUÇÕES ONLINE E CONECTADO!');
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const jid = msg.key.remoteJid;

        // Trava Antissistemas e Grupos: Impedimos o bot de tentar decifrar figurinhas em grupo ou de responder atualizações de status silenciosamente.
        if (jid.includes('@g.us') || jid === 'status@broadcast') {
            return; // Encerra tudo instantaneamente poupando recursos do servidor
        }

        const numeroWhatsApp = jid.split('@')[0];
        const type = Object.keys(msg.message)[0];

        // Extrator Suave: Pegamos o que o cliente digitou independente se foi texto bruto ou formatado, 
        // e o ".trim()" expurga qualquer espaço cego apertado sem querer pelo cliente.
        const resposta = (msg.message?.conversation || msg.message?.extendedTextMessage?.text || "").trim();

        // Regra Protetiva de Mídia: O bot limitará seu ouvido apenas para diálogos e fotos,
        const tiposPermitidos = ['conversation', 'extendedTextMessage', 'imageMessage'];
        if (!tiposPermitidos.includes(type)) {
            await sock.sendMessage(jid, { text: "Desculpe, nosso assistente virtual ainda não compreende áudios ou figurinhas. Por favor, responda com texto ou números das opções." });
            return;
        }

        try {
            // Raio-X Primário: Varremos os bancos de nuvem para entender duas coisas cruciais:
            // De quem é o número e se já estávamos lidando com a solicitação dele recentemente.
            let { data: usuario, error: erroUser } = await supabase
                .from('usuarios')
                .select('*')
                .eq('numero', numeroWhatsApp)
                .maybeSingle();

            let { data: atendimento, error: erroAtend } = await supabase
                .from('atendimentos')
                .select('*')
                .eq('numero_whatsapp', numeroWhatsApp)
                .eq('status', 'aberto')
                .maybeSingle();

            if (erroAtend) {
                console.log("❌ Atenção: Tivemos ruído na comunicação com o Supabase:", erroAtend);
            }

            // Cadastramento Orgânico: Se o usuário não estiver cadastrado, cadastraremos.
            if (!usuario) {
                const { data: novo } = await supabase
                    .from('usuarios')
                    .insert([{ numero: numeroWhatsApp }])
                    .select()
                    .single();
                usuario = novo;
            }

            // O Começo de Tudo (Etapa 0): O bot compreende que ali não existe tratativa aberta. Sendo assim, 
            // formaliza um novo atendimento na estaca zero da jornada (para ser recepcionado no menu logo após).
            if (!atendimento) {
                const { error: erroInsert } = await supabase.from('atendimentos').insert([{
                    numero_whatsapp: numeroWhatsApp,
                    etapa: 0,
                    status: 'aberto' // Sinalizador crucial: permite encontrar o cliente quando ele responder de volta
                }]);

                if (erroInsert) {
                    console.error("❌ ERRO GRAVE NO SUPABASE AO CRIAR ATENDIMENTO:", erroInsert);
                }

                if (!usuario.aceitou_termos) {
                    await sock.sendMessage(jid, { text: "Olá! Bem-vindo ao atendimento da HV Soluções Prediais. \n\nPara sua segurança (LGPD), informamos que seus dados (nome, fotos, telefone) serão usados apenas para orçamentos. Ao prosseguir, você concorda." });
                }

                const saudacao = usuario.nome ? `Olá, ${usuario.nome}! Que bom ter você de volta.` : "No momento estou em atendimento, mas meu assistente vai adiantar seu pedido.";
                await sock.sendMessage(jid, { text: `${saudacao}\n\nEscolha uma opção:\n1️⃣ Novo Serviço\n2️⃣ Informações de serviço em andamento` });
                return;
            }

            // O Cérebro Roteador (Máquina de Estados): Essa estrutura decide qual será o desfecho da conversa.
            switch (Number(atendimento.etapa)) {

                case 0: // Portão de Entrada: Menu principal aliado às permissões legais obrigatórias (Lei LGPD)
                    if (resposta === '1' || resposta === '2') {

                        // Ao clicar na opção ativamente com o fluxo em andamento, assumimos o consentimento 
                        // e imunizamos o usuário para abordagens futuras atualizando sua Flag de LGPD.
                        const { error: erroUsuario } = await supabase
                            .from('usuarios')
                            .update({ aceitou_termos: true })
                            .eq('numero', numeroWhatsApp);

                        if (erroUsuario) {
                            console.log(`❌ Erro ao atualizar termos do usuário ${numeroWhatsApp}:`, erroUsuario);
                        } else {
                            console.log(`✅ Termos aceitos para o usuário ${numeroWhatsApp} no Supabase.`);
                        }

                        if (resposta === '1') {
                            // A vontade manifestada é de serviço novo, validando a Etapa 1.
                            await atualizarEtapa(atendimento.id, 1);

                            await sock.sendMessage(jid, {
                                text: "Qual o tipo de serviço você precisa hoje?\n1. Pintura\n2. Hidráulica\n3. Elétrica\n4. Manutenções Gerais\n5. Voltar"
                            });
                        }
                        else if (resposta === '2') {
                            await sock.sendMessage(jid, {
                                text: "Certo! O responsável já foi notificado e enviará uma atualização em breve. Agradecemos a paciência!"
                            });
                            await encerrarAtendimento(atendimento.id);
                        }
                    }
                    else {
                        await tratarErro(jid, atendimento, sock);
                    }
                    break;

                case 1: // Escolha de Categoria
                    const cats = { "1": "Pintura", "2": "Hidráulica", "3": "Elétrica", "4": "Manutenções Gerais" };
                    if (cats[resposta]) {
                        await atualizarEtapa(atendimento.id, 2, { categoria: cats[resposta] });
                        await sock.sendMessage(jid, { text: "Entendi! Por favor, digite uma breve descrição do que você precisa fazer:" });
                    } else if (resposta === '5') {
                        await atualizarEtapa(atendimento.id, 0);
                        await sock.sendMessage(jid, { text: "Escolha uma opção:\n1️⃣ Novo Serviço\n2️⃣ Andamento" });
                    } else {
                        await tratarErro(jid, atendimento, sock);
                    }
                    break;

                case 2: // Coleta de Escopo
                    await atualizarEtapa(atendimento.id, 3, { resumo: resposta });
                    await sock.sendMessage(jid, { text: "Perfeito. Você tem fotos do local ou do problema?\n1️⃣ Sim\n2️⃣ Não" });
                    break;

                case 3: // Decisão de Fotos
                    if (resposta === '1') {
                        await atualizarEtapa(atendimento.id, 4);
                        await sock.sendMessage(jid, { text: "Ótimo! Por favor, me envie as fotos agora (até 2 fotos)." });
                    } else if (resposta === '2') {
                        await passarParaLocalizacao(jid, atendimento.id, sock);
                    } else {
                        await tratarErro(jid, atendimento, sock);
                    }
                    break;

                case 4: // Recebimento de Imagens
                    if (type === 'imageMessage') {
                        await sock.sendMessage(jid, { text: "⏳ Baixando e salvando sua foto na nuvem..." });

                        try {
                            // 2. Extrai e baixa a foto usando o Baileys
                            const buffer = await downloadMediaMessage(
                                msg,
                                'buffer',
                                {},
                                { logger: pino({ level: 'silent' }), reuploadRequest: sock.updateMediaMessage }
                            );

                            // 3. Cria um nome único usando o número do whats e a Data/Hora
                            const nomeArquivo = `${numeroWhatsApp}_${Date.now()}.jpg`;

                            // 4. Faz o Upload no bucket do Supabase (Assuma um bucket chamado 'fotos_atendimento')
                            const { error: erroUpload } = await supabase.storage
                                .from('fotos_atendimento')
                                .upload(nomeArquivo, buffer, {
                                    contentType: 'image/jpeg',
                                    upsert: true
                                });

                            if (erroUpload) {
                                console.error("Erro grave no upload da foto: ", erroUpload);
                                throw erroUpload;
                            }

                            // 5. Pega o Link Público do Supabase recém-criado
                            const { data: publicData } = supabase.storage
                                .from('fotos_atendimento')
                                .getPublicUrl(nomeArquivo);

                            const urlDaFoto = publicData.publicUrl;

                            // 6. Atualiza a coluna de fotos no Banco de Dados
                            let fotosExistentes = atendimento.fotos || [];
                            // Garante que o retorno é tratado como Array (para evitar erro caso tivessem strings antes)
                            if (typeof fotosExistentes === 'string') {
                                fotosExistentes = fotosExistentes ? [fotosExistentes] : [];
                            }

                            // Adiciona a foto nova na matriz/lista de fotos
                            const novoVetorFotos = [...fotosExistentes, urlDaFoto];

                            await atualizarEtapa(atendimento.id, 4, { fotos: novoVetorFotos });

                            await sock.sendMessage(jid, {
                                text: "📸 Foto processada com sucesso! \n\nSe precisar enviar mais detalhes, **basta mandar a próxima foto**.\n\n👉 Caso **já tenha enviado tudo**, digite **1** para finalizar o envio."
                            });
                        } catch (err) {
                            console.error("Erro na recepção ou upload de imagem:", err);
                            await sock.sendMessage(jid, {
                                text: "❌ Poxa! Ocorreu um erro ao salvar sua foto no nosso servidor. Você pode tentar enviá-la novamente ou digitar **1** se para pular esta etapa."
                            });
                        }
                    } else if (resposta === '1') {
                        // O cliente finalizou o envio, agora avançamos para a Região!
                        await passarParaLocalizacao(jid, atendimento.id, sock);
                    } else {
                        // Se ele digitar texto aleatório em vez da foto ou do número 1
                        await tratarErro(jid, atendimento, sock);
                    }
                    break;

                case 5: // Localização
                    const regioes = { "1": "Porto Alegre - Centro", "2": "Porto Alegre - Zona Norte", "3": "Porto Alegre - Zona Sul", "4": "Região Metropolitana", "5": "Guaíba", "6": "Barra do Ribeiro", "7": "Outros" };
                    if (regioes[resposta]) {
                        await atualizarEtapa(atendimento.id, 6, { regiao: regioes[resposta] });
                        if (!usuario.nome) {
                            await sock.sendMessage(jid, { text: "Para finalizarmos, como você gostaria de ser chamado?" });
                        } else {
                            await finalizarTudo(jid, usuario.nome, atendimento, sock);
                        }
                    } else {
                        await tratarErro(jid, atendimento, sock);
                    }
                    break;

                case 6: // Nome Final (Se novo)
                    await supabase.from('usuarios').update({ nome: resposta }).eq('numero', numeroWhatsApp);
                    await finalizarTudo(jid, resposta, atendimento, sock);
                    break;
            }
        } catch (err) {
            console.error("Erro no processamento:", err);
        }
    });
}

// FUNÇÕES AUXILIARES PARA LIMPEZA DE CÓDIGO
async function atualizarEtapa(id, etapa, dados = {}) {
    const { error } = await supabase.from('atendimentos').update({ etapa, tentativas_invalidas: 0, ...dados }).eq('id', id);
    if (error) {
        console.error("❌ ERRO AO ATUALIZAR ETAPA NO SUPABASE:", error);
        throw error;
    }
}

async function tratarErro(jid, atendimento, sock) {
    const novosErros = (atendimento.tentativas_invalidas || 0) + 1;
    if (novosErros >= 3) {
        await sock.sendMessage(jid, { text: "Como não consegui identificar uma opção válida, estou encerrando o atendimento. Verei suas mensagens e entrarei em contato!" });
        await encerrarAtendimento(atendimento.id);
    } else {
        const { error } = await supabase.from('atendimentos').update({ tentativas_invalidas: novosErros }).eq('id', atendimento.id);
        if (error) {
            console.error("❌ ERRO AO ATUALIZAR TENTATIVAS:", error);
            throw error;
        }
        await sock.sendMessage(jid, { text: "Opção inválida. Por favor, responda com o número de uma das opções acima." });
    }
}

async function encerrarAtendimento(id) {
    const { error } = await supabase.from('atendimentos').update({ status: 'finalizado' }).eq('id', id);
    if (error) {
        console.error("❌ ERRO AO ENCERRAR ATENDIMENTO:", error);
        throw error;
    }
}

async function passarParaLocalizacao(jid, id, sock) {
    await atualizarEtapa(id, 5);
    await sock.sendMessage(jid, { text: "Onde o serviço será realizado?\n1. Porto Alegre - Centro\n2. Porto Alegre - Zona Norte\n3. Porto Alegre - Zona Sul\n4. Região Metropolitana\n5. Guaíba\n6. Barra do Ribeiro\n7. Outros" });
}

async function finalizarTudo(jid, nome, atendimento, sock) {
    // Busca dados atualizados para a mensagem final
    const { data: att } = await supabase.from('atendimentos').select('*').eq('id', atendimento.id).single();
    await sock.sendMessage(jid, { text: `Tudo certo, ${nome}! Registrei seu pedido de ${att.categoria} em ${att.regiao}. Entrarei em contato em breve!` });
    await encerrarAtendimento(atendimento.id);
}

connectToWhatsApp();