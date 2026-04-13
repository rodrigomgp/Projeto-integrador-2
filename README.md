# Projeto-integrador-2

# 🤖 WhatsApp Bot + Integrado com Supabase

Projeto de automação de mensagens via WhatsApp integrado com banco de dados relacional (PostgreSQL). 

##  Funcionalidades
- Conexão via QR Code.
- Identificação automática de usuários (JID/LID).
- **Integração com Supabase:** Cadastro automático de novos usuários.
- **Persistência de dados:** Evita duplicidade de registros.
- Filtro de mensagens em tempo real (ignora histórico antigo).

## Tecnologias Utilizadas
- [Node.js](https://nodejs.org/)
- [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp API
- [Supabase](https://supabase.com/) - Banco de Dados em nuvem (PostgreSQL)

## Pré-requisitos
Antes de rodar o projeto, você precisará instalar as dependências:
```bash
npm install @whiskeysockets/baileys @supabase/supabase-js qrcode-terminal pino

## Ajustar keys conforme env example.
