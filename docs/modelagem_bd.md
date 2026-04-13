# Modelagem do Banco de Dados (Supabase / PostgreSQL)

Esta modelagem suporta o fluxo de atendimento e garante a rastreabilidade do consentimento exigido pela LGPD.

## 1. Dicionário de Dados

### Tabela: `usuarios`
Responsável por armazenar os contatos e os registros de privacidade.
* **id**: (UUID) Identificador único.
* **telefone**: (String) Número do WhatsApp (Chave Única).
* **nome**: (String) Nome de preferência do cliente.
* **aceitou_termos**: (Boolean) Define se o usuário avançou após o aviso da LGPD. (Padrão: FALSE).
* **data_aceite**: (Timestamp) Registro de quando o consentimento foi dado.
* **criado_em**: (Timestamp) Data do primeiro contato.

### Tabela: `atendimentos`
Responsável por registrar cada escopo de serviço (Manutenção Residencial e Comercial).
* **id**: (UUID) Identificador único do ticket.
* **usuario_id**: (UUID) Chave Estrangeira ligada à tabela `usuarios`.
* **categoria**: (String) Tipo de serviço.
* **resumo**: (Text) Descrição do problema.
* **foto1_url / foto2_url**: (String) Links das fotos no Storage.
* **regiao**: (String) Macrorregião escolhida no menu.
* **status**: (String) "Aberto", "Em Andamento" ou "Finalizado".
* **criado_em**: (Timestamp) Data da solicitação.

### Tabela: `sessoes_bot` (Controle de Estado)
Responsável por ser a "memória" do bot em Node.js.
* **telefone**: (String) Número do WhatsApp (Chave Primária).
* **passo_atual**: (String) A etapa atual (Ex: `aguardando_resumo`).
* **tentativas_falhas**: (Int) Contador de erros (máximo 3).
* **atualizado_em**: (Timestamp) Última interação.

---

## 2. Diagrama Entidade-Relacionamento (DER)

```mermaid
erDiagram
    USUARIOS {
        uuid id PK
        string telefone UK
        string nome
        boolean aceitou_termos "Obrigatório p/ LGPD"
        timestamp data_aceite
        timestamp criado_em
    }
    
    ATENDIMENTOS {
        uuid id PK
        uuid usuario_id FK
        string categoria
        text resumo
        string foto1_url
        string foto2_url
        string regiao
        string status
        timestamp criado_em
    }

    SESSOES_BOT {
        string telefone PK
        string passo_atual
        int tentativas_falhas
        timestamp atualizado_em
    }

    USUARIOS ||--o{ ATENDIMENTOS : "solicita"
    USUARIOS ||--|| SESSOES_BOT : "mantém estado"