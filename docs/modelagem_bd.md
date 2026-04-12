# Modelagem do Banco de Dados (Supabase / PostgreSQL)

Para suportar o fluxo de atendimento da HV Soluções Prediais, o banco de dados foi estruturado em três tabelas principais. Esta arquitetura garante o registro de clientes, o armazenamento dos pedidos de orçamento e o gerenciamento de estado do bot.

## 1. Dicionário de Dados

### Tabela: `usuarios`
Responsável por armazenar os contatos únicos.
* **id**: (UUID) Identificador único gerado automaticamente.
* **telefone**: (String) Número do WhatsApp (Chave Única).
* **nome**: (String) Nome de preferência do cliente (pode ser nulo até ele informar no primeiro contato).
* **criado_em**: (Timestamp) Data do primeiro contato.

### Tabela: `atendimentos`
Responsável por registrar cada escopo de serviço solicitado.
* **id**: (UUID) Identificador único do ticket.
* **usuario_id**: (UUID) Chave Estrangeira ligando à tabela `usuarios`.
* **categoria**: (String) O tipo de serviço (Pintura, Hidráulica, Elétrica, Manutenções Gerais).
* **resumo**: (Text) Texto descritivo do problema.
* **foto1_url**: (String) Caminho/Link da primeira foto no Storage do Supabase (Nulo se não tiver).
* **foto2_url**: (String) Caminho/Link da segunda foto no Storage do Supabase (Nulo se não tiver).
* **regiao**: (String) Macrorregião escolhida no menu.
* **status**: (String) Estado do pedido (Ex: "Aberto", "Em Andamento", "Finalizado"). Padrão: "Aberto".
* **criado_em**: (Timestamp) Data da solicitação.

### Tabela: `sessoes_bot` (Controle de Estado)
Responsável por ser a "memória" do bot em Node.js.
* **telefone**: (String) Número do WhatsApp atuando como Chave Primária.
* **passo_atual**: (String) A etapa onde o cliente parou (Ex: `aguardando_resumo`, `aguardando_fotos`).
* **tentativas_falhas**: (Int) Contador de erros (máximo 3).
* **atualizado_em**: (Timestamp) Última interação. (Pode ser usado para zerar/limpar sessões abandonadas).

---

## 2. Diagrama Entidade-Relacionamento (DER)

Abaixo está o diagrama visual das nossas tabelas e como elas se conectam:

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        string telefone UK "Número do WhatsApp"
        string nome "Nome do cliente"
        timestamp criado_em
    }
    
    ATENDIMENTOS {
        uuid id PK
        uuid usuario_id FK "Relacionamento com Usuário"
        string categoria "Ex: Pintura, Elétrica"
        text resumo "Descrição do problema"
        string foto1_url "Link da foto 1"
        string foto2_url "Link da foto 2"
        string regiao "Ex: Zona Sul, Centro"
        string status "Aberto, Finalizado"
        timestamp criado_em
    }

    SESSOES_BOT {
        string telefone PK "Número do WhatsApp"
        string passo_atual "Ex: aguardando_resumo"
        int tentativas_falhas "Contador de erros"
        timestamp atualizado_em
    }

    USUARIOS ||--o{ ATENDIMENTOS : "solicita"
    USUARIOS ||--|| SESSOES_BOT : "mantém estado" 
