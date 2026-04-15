# Estrutura e Lógica do Bot de Atendimento

### Regras Globais do Sistema
* **Filtro de Mídia:** O bot deve ignorar Áudio, Stickers, Emojis soltos e Documentos (exceto as imagens na etapa de fotos). Retornar mensagem: *"Desculpe, nosso assistente virtual ainda não compreende áudios ou figurinhas. Por favor, responda com texto ou números das opções."*
* **Regra de Falha (Fallback):** Máximo de 3 tentativas inválidas consecutivas em qualquer etapa. Após a 3ª falha, acionar a Mensagem de Erro e encerrar a sessão.
* **Identificação Inicial:** Ao receber a primeira mensagem, o sistema captura o número de telefone e faz uma query no Supabase.

---

### Etapa 0: Identificação, LGPD e Saudação
* **Ação:** Buscar Telefone no Supabase. `(BANCO DE DADOS: Consulta)`
* **Se Cliente Novo:** Salvar Telefone. `(BANCO DE DADOS: Insert)`
    * *Mensagem de LGPD (Primeiro Envio):* "Olá! Bem-vindo ao atendimento da HV Soluções Prediais. Para sua segurança e em conformidade com a LGPD, informamos que os dados coletados (nome, telefone e fotos) serão usados apenas para a elaboração de orçamentos e prestação dos serviços de manutenção. Ao prosseguir, você concorda com este uso."
    * *Mensagem de Saudação:* "No momento estou em atendimento, mas meu assistente virtual vai adiantar o seu pedido. Por favor, escolha uma opção:"
    * *Ação Interna:* O sistema registra o `aceitou_termos = true` no banco de dados assim que o cliente responde com uma opção válida.
* **Se Cliente Existente (Nome cadastrado e Termos aceitos):**
    * *Mensagem:* "Olá, [Nome do Cliente]! Que bom ter você de volta à HV Soluções. No momento estou ocupado, mas vamos adiantar o que você precisa. Escolha uma opção:"

**Menu Principal:**
1. Novo Serviço
2. Informações de serviço em andamento

---

### Etapa 1: Direcionamento
* **Se 2 (Andamento):**
    * *Mensagem:* "Certo! O responsável já foi notificado sobre o seu contato e assim que estiver disponível, enviará uma atualização sobre o seu serviço em andamento. Agradecemos a paciência!" *(Encerra a sessão)*
* **Se 1 (Novo Serviço):**
    * *Mensagem:* "Qual o tipo de serviço você precisa hoje? Digite o número da opção:"
    1. Pintura
    2. Hidráulica
    3. Elétrica
    4. Manutenções Gerais
    5. Voltar ao menu inicial
    * *Ação:* `(BANCO DE DADOS: Salvar a Categoria do Serviço temporariamente)`

---

### Etapa 2: Coleta de Escopo (Resumo)
* *Mensagem:* "Entendi! Para que eu possa avaliar melhor, por favor, digite uma breve descrição do que você precisa fazer:"
    * *(O bot aguarda texto livre)*
* *Ação:* `(BANCO DE DADOS: Salvar o Texto do Resumo)`

---

### Etapa 3: Coleta de Imagens
* *Mensagem:* "Perfeito. Você tem fotos do local ou do problema que possam ajudar no orçamento?"
    1. Sim, tenho fotos
    2. Não tenho fotos no momento
* **Se 1 (Sim):**
    * *Mensagem:* "Ótimo! Por favor, me envie até 2 fotos agora."
    * *(Aguardar recebimento de imagem)*
    * *Ação:* `(BANCO DE DADOS: Salvar links das Fotos)`
* **Se 2 (Não):**
    * Segue para a próxima etapa.

---

### Etapa 4: Localização
* *Mensagem:* "Onde o serviço será realizado? Escolha a região:"
    1. Porto Alegre - Centro
    2. Porto Alegre - Zona Norte
    3. Porto Alegre - Zona Sul
    4. Região Metropolitana
    5. Guaíba
    6. Barra do Ribeiro
    7. Outros
* *Ação:* `(BANCO DE DADOS: Salvar Região)`

---

### Etapa 5: Identificação Final (Se Cliente Novo)
* *Ação:* O sistema verifica se já possui o nome do cliente. Se não tiver:
    * *Mensagem:* "Para finalizarmos, como você gostaria de ser chamado?"
    * *Ação:* `(BANCO DE DADOS: Update Nome do Cliente atrelado ao Telefone)`

---

### Etapa 6: Finalização
* *Mensagem Final:* "Tudo certo, [Nome]! Já registrei seu pedido de [Categoria] na região de [Região]. Lerei as informações assim que possível e entrarei em contato para darmos seguimento. Muito obrigado!"
* *Ação:* `(BANCO DE DADOS: Confirmar e fechar o Ticket/Registro de Atendimento no Supabase)`

**Tratamento de Erro:**
* *Mensagem de Erro:* "Como não consegui identificar uma opção válida, estou encerrando este atendimento virtual. Mas não se preocupe, verei suas mensagens e entrarei em contato assim que possível!"

---

## Diagrama de Lógica (Máquina de Estados)

Abaixo está o diagrama visual para guiar o desenvolvimento em Node.js e as interações com o banco de dados:

```mermaid
stateDiagram-v2
    [*] --> Recebe_Mensagem
    
    Recebe_Mensagem --> Check_Supabase: Captura Telefone
    
    Check_Supabase --> Cliente_Novo: Telefone não existe
    Check_Supabase --> Cliente_Existente: Telefone existe
    
    Cliente_Novo --> Menu_Principal: (Insert DB) Msg Saudação Genérica
    Cliente_Existente --> Menu_Principal: Msg Saudação Personalizada
    
    Menu_Principal --> Serviço_Andamento: Opção 2
    Serviço_Andamento --> Finaliza_Atendimento
    
    Menu_Principal --> Menu_Serviços: Opção 1
    
    Menu_Serviços --> Pede_Resumo: Opções 1 a 4 (Save DB Categoria)
    Menu_Serviços --> Menu_Principal: Opção 5 (Voltar)
    
    Pede_Resumo --> Pede_Fotos: Recebe Texto (Save DB Resumo)
    
    Pede_Fotos --> Aguarda_Imagens: Opção 1 (Sim)
    Aguarda_Imagens --> Pede_Localizacao: Recebe Mídia (Save DB Fotos)
    Pede_Fotos --> Pede_Localizacao: Opção 2 (Não)
    
    Pede_Localizacao --> Verifica_Nome: Opções 1 a 7 (Save DB Local)
    
    Verifica_Nome --> Pede_Nome: Nome Ausente no DB
    Pede_Nome --> Finaliza_Sucesso: Recebe Texto (Update DB Nome)
    
    Verifica_Nome --> Finaliza_Sucesso: Nome Já Existe no DB
    
    Finaliza_Sucesso --> [*]: (Commit Final DB) Msg Agradecimento
    Finaliza_Atendimento --> [*]: Msg Agradecimento
    
    note right of Recebe_Mensagem: Falhas > 3x envia Msg Transbordo e vai para [*]