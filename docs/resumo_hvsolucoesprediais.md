Nome fantasia: HV Soluções Prediais
Nome: 40.847.151 HECTOR VINICIUS FERREIRA SILVA
CNPJ: 40.847.151/0001-02
Endereço: Dr. Marinho Chaves, 25 - Centro, Barra do Ribeiro - RS
Telefone: 51 99956-6152
E-mail: hvsolucoesprediais@gmail.com

---

# 1. APRESENTAÇÃO DA EMPRESA
A HV Soluções Prediais é uma empresa especialista em Manutenção Residencial e Comercial. Atualmente, a empresa está estruturada como MEI e possui uma operação centralizada. Nossos principais serviços incluem elétrica, hidráulica, pintura, vidraçaria e reparos estruturais.

# 2. DESAFIO DE NEGÓCIO
Atualmente, a HV Soluções Prediais enfrenta um gargalo no seu fluxo de atendimento. Sendo uma empresa com operação solo, o profissional responsável pela execução técnica é o mesmo responsável pelo atendimento comercial via WhatsApp. A demora no primeiro contato resulta diretamente na perda do orçamento para a concorrência.

# 3. SOLICITAÇÃO DE SOLUÇÃO TECNOLÓGICA (ESCOPO ATUALIZADO)
Solicitamos ao grupo de desenvolvimento a criação de um Assistente Virtual (Chatbot), desenvolvido em **JavaScript (Node.js)** utilizando a biblioteca **Baileys**, e integrado ao banco de dados **Supabase**.

O bot deve operar como uma **Máquina de Estados**, guiando o cliente por um fluxo fechado de perguntas para qualificar o lead antes da intervenção humana.

**Requisitos Funcionais Obrigatórios:**
* **Identificação Automática:** Consultar o Supabase pelo número de telefone logo na primeira mensagem.
* **Filtro de Mídia e Fallback:** Limite de 3 tentativas falhas antes de acionar a "Mensagem de Transbordo".
* **Menu de Direcionamento e Triagem:** Coletar categoria, resumo do problema, até 2 fotos, macrorregião (POA, Metropolitana, Guaíba, Barra do Ribeiro, etc.) e nome.

# 4. CONSIDERAÇÕES DE SEGURANÇA E LGPD
A HV Soluções Prediais preza pela segurança de seus clientes. É requisito indispensável que a ferramenta trate os dados (telefones, endereços, nomes e mídias) com protocolos de segurança adequados no Supabase.

O tratamento dos dados no bot é baseado no **Consentimento** e na **Execução de Contrato** (Art. 7º, I e V da LGPD). O sistema deverá apresentar um aviso de privacidade no primeiro contato e registrar o aceite dos termos antes de dar seguimento ao atendimento.

# 5. RESULTADO ESPERADO
Esperamos reduzir o tempo de resposta inicial para zero, recebendo "Tickets" pré-qualificados, com o escopo do problema, fotos e localização do cliente já organizados, prontos para a elaboração ágil do orçamento.