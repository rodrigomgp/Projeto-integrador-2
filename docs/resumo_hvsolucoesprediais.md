Nome fantasia: HV Soluções Prediais
Nome: 40.847.151 HECTOR VINICIUS FERREIRA SILVA
CNPJ: 40.847.151/0001-02
Endereço: Dr. Marinho Chaves, 25 - Centro, Barra do Ribeiro - RS
Telefone: 51 99956-6152
E-mail: hvsolucoesprediais@gmail.com

---

# 1. APRESENTAÇÃO DA EMPRESA
A HV Soluções Prediais é uma empresa prestadora de serviços de manutenção e reforma predial, operando tanto no segmento residencial quanto comercial. Atualmente, a empresa está estruturada como MEI e possui uma operação centralizada. Nossos principais serviços incluem elétrica, hidráulica, pintura, vidraçaria e reparos estruturais.

# 2. DESAFIO DE NEGÓCIO
Atualmente, a HV Soluções Prediais enfrenta um gargalo no seu fluxo de atendimento. Sendo uma empresa com operação solo, o profissional responsável pela execução técnica é o mesmo responsável pelo atendimento comercial via WhatsApp.

**O Problema:** Durante a execução de serviços ou visitas técnicas, é impossível dar uma resposta imediata aos novos leads. A demora no primeiro contato resulta diretamente na perda do orçamento para a concorrência.

# 3. SOLICITAÇÃO DE SOLUÇÃO TECNOLÓGICA (ESCOPO ATUALIZADO)
Solicitamos ao grupo de desenvolvimento a criação de um Assistente Virtual (Chatbot), desenvolvido em **JavaScript (Node.js)** utilizando a biblioteca **Baileys**, e integrado ao banco de dados **Supabase**, para atuar como a primeira interface de atendimento.

O bot deve operar como uma **Máquina de Estados**, guiando o cliente por um fluxo fechado de perguntas para qualificar o lead antes da intervenção humana.

**Requisitos Funcionais Obrigatórios:**
* **Identificação Automática:** Consultar o Supabase pelo número de telefone logo na primeira mensagem para identificar se é um cliente novo ou recorrente (saudação personalizada).
* **Filtro de Mídia e Fallback:** O sistema não deve processar áudios, stickers ou emojis isolados. Em caso de envio incorreto ou respostas fora do menu numérico, o bot deve possuir um limite de 3 tentativas falhas antes de acionar a "Mensagem de Transbordo" e encerrar a sessão virtual.
* **Menu de Direcionamento:** Separar quem busca informações de "Serviços em Andamento" de quem deseja um "Novo Serviço".
* **Triagem de Novo Serviço:** Para novos pedidos, o bot deve coletar e salvar no banco de dados, em ordem estrita:
  1. A categoria do serviço (Pintura, Hidráulica, Elétrica, Manutenções Gerais).
  2. Um resumo em texto do problema/demanda.
  3. A captação de até 2 fotos do local (caso o cliente possua).
  4. A macrorregião do atendimento (Centro POA, Zona Norte POA, Zona Sul POA, Região Metropolitana, Guaíba, Barra do Ribeiro, Outros).
  5. O nome do cliente (apenas se for o primeiro contato).

*(Nota aos desenvolvedores: O detalhamento técnico das mensagens e diagrama de estados encontra-se no arquivo `arquitetura_atendimento.md` documentado neste repositório).*

# 4. CONSIDERAÇÕES DE SEGURANÇA (LGPD)
A HV Soluções Prediais preza pela segurança de seus clientes. É requisito indispensável que a ferramenta trate os dados (telefones, endereços, nomes e mídias) com protocolos de segurança e que o banco de dados no Supabase esteja devidamente protegido contra acessos não autorizados.

# 5. RESULTADO ESPERADO
Esperamos reduzir o tempo de resposta inicial para zero. Quando o técnico responsável abrir o WhatsApp após finalizar um trabalho em campo, ele não verá mensagens soltas, mas sim "Tickets/Registros" pré-qualificados, com o escopo do problema, fotos e localização do cliente já organizados, prontos para a elaboração ágil do orçamento final.

---
HV Soluções Prediais