# Relatório Técnico de Implantação e Refatoração (Projeto Integrador 2)


## 1. Visão Geral
Este documento consolida todas as falhas mapeadas, diagnósticos e correções aplicadas no código fonte (`src/index.js`) durante a transição do ambiente de desenvolvimento para a produção. O objetivo das alterações foi garantir estabilidade de rede, tolerância a falhas invisíveis, suporte a configurações específicas do cliente (LGPD/Mensagens Temporárias) e permitir a transição contínua para o atendimento humano (Handover).

## 2. Histórico de Falhas e Soluções Arquiteturais

### 2.1. Conflito entre Bot e Atendimento Humano (Handover)
* **O Problema:** O fluxo original alterava o status do Supabase para `finalizado` ao fim da triagem. Se o cliente enviasse nova mensagem, o bot reiniciava a máquina de estados, impedindo o profissional de assumir a conversa para negociar orçamentos.
* **A Solução:** O status final da triagem passou a ser `em_andamento`. Quando o banco acusa esse status, o bot entra em modo de escuta silenciosa. Implementamos um ouvinte para o remetente (`msg.key.fromMe`). Quando o atendente envia frases orgânicas (ex: *"obrigado pela preferência"*, *"obrigado pelo contato"*, ou `"#encerrar"`), o sistema muda o status para `finalizado` invisivelmente.

### 2.2. Bloqueio de Áudios por Configuração de Mensagens Temporárias
* **O Problema:** Contas do WhatsApp configuradas com "Mensagens Temporárias" (Ephemeral Messages) não ativavam a regra de bloqueio de áudio/mídia, fazendo o bot parar de responder.
* **A Solução:** Inserção de lógica de desempacotamento de protocolo. O código agora verifica se o pacote é temporário (`ephemeralMessage`) e acessa a camada interna da mensagem para descobrir o conteúdo real e processá-lo corretamente.

### 2.3. Sessões Zumbis e o Erro 515 (Restart Required)
* **O Problema:** Oscilações na internet causavam falha de criptografia no Baileys (Erro 515). A estrutura antiga utilizava chamadas recursivas, acumulando instâncias zumbis na memória RAM e corrompendo a sessão.
* **A Solução:** O bot foi instruído a encerrar o processo (`process.exit(1)`) caso a conexão caia, delegando a reinicialização limpa para um gerenciador de processos externo (PM2).

### 2.4. Congelamento Silencioso de Socket (Silent Hang)
* **O Problema:** O bot congelava após algumas horas de produção sem exibir erros. O WhatsApp sofria microquedas que não geravam alertas no código, e o bot ficava aguardando mensagens com tempo de espera infinito.
* **A Solução:** 1. Alteração do `defaultQueryTimeoutMs` para 60000 (60 segundos).
  2. Aumento do `keepAliveIntervalMs` (30 segundos).
  3. Adição da trava global `process.on('uncaughtException')` para forçar o encerramento da aplicação diante de falhas silenciosas.

### 2.5. Erro PGRST116 (Múltiplos Registros no Banco de Dados)
* **O Problema:** Devido aos travamentos anteriores, clientes acumularam múltiplos chamados com status `aberto` no Supabase. O código usava a função `.maybeSingle()`, que entrava em colapso ao encontrar mais de uma linha correspondente para o mesmo número.
* **A Solução:** A query de busca do Supabase foi refatorada para ordenar os resultados por data de criação de forma decrescente e limitar a resposta a apenas uma linha (`.limit(1)`). Isso garante que, mesmo havendo lixo no banco, o sistema pegue sempre a interação mais recente.

## 3. Implementação do Gerenciador PM2
Para viabilizar as estratégias de encerramento seguro e garantir que a aplicação operasse de forma autônoma 24/7, introduzimos o **PM2**.
* **Ação:** O PM2 roda em segundo plano. Sempre que o bot aciona o `process.exit(1)`, o PM2 detecta a queda e reinicia o arquivo instantaneamente.
* **Rotina Preventiva:** Foi configurada uma flag de reinício diário preventivo (`--cron-restart="0 3 * * *"`), forçando o servidor a limpar o cache todos os dias às 03:00 da manhã.

## 4. Conclusão
A arquitetura refatorada atinge os requisitos de produção: isola pacotes não suportados, adequa-se a regras de privacidade, previne o travamento por corrupção de socket e dados duplicados, e viabiliza um fluxo de atendimento híbrido altamente resiliente.