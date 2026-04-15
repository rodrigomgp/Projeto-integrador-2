# Assistente Virtual de Atendimento: HV Soluções Prediais

## Descrição do Projeto
Este repositório contém o código-fonte do assistente virtual desenvolvido para a etapa de triagem de atendimento via WhatsApp da HV Soluções Prediais, empresa com foco em manutenção predial. 

O sistema foi arquitetado como uma máquina de estados e atua como a interface inicial de contato, estruturando o escopo do pedido do cliente, capturando dados e mídias essenciais, e garantindo a conformidade com a legislação de privacidade antes do transbordo para o atendimento humano especializado.

## Funcionalidades Principais
* **Conexão Segura:** Autenticação de sessão direta via QR Code no terminal.
* **Máquina de Estados de Triagem:** Fluxo guiado para identificação de novos serviços vs. serviços em andamento.
* **Persistência Relacional:** Integração estruturada via `upsert` com tabelas de usuários, atendimentos e memória de sessão no Supabase.
* **Adequação à LGPD:** Protocolo de aceite obrigatório e registro de consentimento de uso de dados no primeiro contato.
* **Tratamento de Exceções:** Filtro temporal de mensagens antigas, descarte de formatos de mídia não suportados e regra de fallback para entradas inválidas.

## Tecnologias Utilizadas
* **Linguagem Base:** [Node.js](https://nodejs.org/)
* **Integração WhatsApp:** [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys)
* **Banco de Dados:** [Supabase](https://supabase.com/) (PostgreSQL em Nuvem)

## Pré-requisitos e Instalação

Para configurar o ambiente de desenvolvimento, certifique-se de ter o Node.js instalado e execute o comando abaixo para instalar todas as dependências mapeadas:

```bash
npm install