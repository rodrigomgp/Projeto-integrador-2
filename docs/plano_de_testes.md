# Plano de Testes e Validação - Bot HV Soluções Prediais

Este documento descreve os **Casos de Teste (CT)** obrigatórios que a equipe de desenvolvimento deve executar antes de o bot ser colocado em produção. O objetivo é validar a Máquina de Estados, as integrações com o Supabase e os tratamentos de erro.

---

## CT-01: Primeira Interação e LGPD (Cliente Novo)
* **Objetivo:** Garantir que um número novo receba o aviso de privacidade e seja salvo.
* **Passos:**
  1. Enviar um "Oi" de um número que NÃO está no Supabase.
  2. O bot deve responder com a mensagem de Saudação + Aviso LGPD.
  3. Responder com qualquer número válido do menu (ex: `1`).
* **Critério de Sucesso:** O bot avança de etapa e, ao checar a tabela `usuarios` no Supabase, o número deve estar salvo com o campo `aceitou_termos` marcado como `true`.

## CT-02: Filtro de Mídia Bloqueada
* **Objetivo:** Validar se o bot recusa áudios, stickers e documentos fora de hora.
* **Passos:**
  1. Iniciar uma conversa.
  2. Quando o bot mostrar um menu, enviar um **Áudio** ou uma **Figurinha**.
* **Critério de Sucesso:** O bot NÃO deve quebrar. Ele deve responder imediatamente: *"Desculpe, nosso assistente virtual ainda não compreende áudios ou figurinhas. Por favor, responda com texto ou números das opções."*

## CT-03: Regra de Transbordo (Máximo 3 Erros)
* **Objetivo:** Testar se a sessão é encerrada caso o cliente digite opções inválidas repetidamente.
* **Passos:**
  1. Acionar o bot e chegar na etapa de Tipo de Serviço (1 a 5).
  2. Digitar `Batata` (1º erro).
  3. Digitar `99` (2º erro).
  4. Enviar um *Áudio* (3º erro).
* **Critério de Sucesso:** Após o terceiro erro consecutivo, o bot deve enviar a Mensagem de Erro de transbordo ("Como não consegui identificar uma opção válida..."), encerrar a sessão e limpar a memória (tabela `sessoes_bot`).

## CT-04: Fluxo Completo - Novo Orçamento COM Fotos
* **Objetivo:** Simular o "Caminho Feliz" mais longo do sistema.
* **Passos:**
  1. Enviar "Oi".
  2. Escolher `1` (Novo Serviço).
  3. Escolher `1` (Pintura).
  4. Digitar o texto: `"Preciso pintar a fachada da minha casa."`
  5. Escolher `1` (Sim, tenho fotos).
  6. Enviar 2 imagens pela galeria do WhatsApp.
  7. Escolher `6` (Barra do Ribeiro).
  8. Digitar o nome: `"Carlos"`.
* **Critério de Sucesso:** O bot deve exibir a Mensagem Final de sucesso. Na tabela `atendimentos` do Supabase, o ticket deve constar com a categoria, resumo, região e os **URLs das duas fotos**. Na tabela `usuarios`, o nome deve ser atualizado para "Carlos".

## CT-05: Fluxo Completo - Novo Orçamento SEM Fotos
* **Objetivo:** Validar o pulo (bypass) da etapa de mídias.
* **Passos:**
  1. Fazer o mesmo fluxo do CT-04, mas na etapa de fotos, escolher `2` (Não tenho fotos no momento).
* **Critério de Sucesso:** O bot não deve travar esperando imagens, passando direto para a pergunta de Localização. No Supabase, os campos `foto1_url` e `foto2_url` devem ficar nulos/vazios.

## CT-06: Identificação de Cliente Recorrente
* **Objetivo:** Validar se o bot reconhece quem já aceitou a LGPD e já informou o nome.
* **Passos:**
  1. Usar o MESMO número de WhatsApp que finalizou o CT-04 com sucesso e mandar um "Oi" novamente.
* **Critério de Sucesso:** O bot NÃO deve mostrar a mensagem de LGPD. Ele deve saudar pelo nome: *"Olá, Carlos! Que bom ter você de volta..."* e no final do fluxo (após a região), **NÃO** deve pedir o nome novamente.

## CT-07: Fluxo de Serviço em Andamento
* **Objetivo:** Validar o desvio rápido de atendimento.
* **Passos:**
  1. Iniciar a conversa.
  2. No menu principal, escolher `2` (Informações de serviço em andamento).
* **Critério de Sucesso:** O bot envia a mensagem de que o responsável já foi notificado, encerra a sessão e limpa a memória de estado.