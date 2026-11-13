# Planejamento do módulo de IA

## Plano implementado

### Fluxo e limites

- Usuário: Rodrigo, integrante da equipe do balcão.
- Tela: triagem de achados, em `frontend/src/telas/gestao/balcao/Triagem.jsx`.
- Entrada: categoria, cor, marca e descrição do objeto recebido; modelo e turno transitórios;
  pavilhão e data existentes. O backend consulta avisos de perda em aberto.
- Saída: sugestões com pontuação, características compatíveis, explicação e situação real do aviso.
  Rodrigo confere, seleciona e confirma antes de usar a rota existente de registro.
- A rota `POST /ia/sugestoes` não grava. Se todos os provedores falharem, responde HTTP 503 com
  orientação para continuar pela busca manual.
- A comparação local exige pelo menos três características compatíveis antes de aceitar uma
  sugestão do modelo; a resposta também é validada para impedir IDs e características inventados.
- A triagem usa um `Agent` do Jangada com a tool local `calcular_compatibilidades_da_consulta`;
  a rota continua chamando apenas a função da pasta `ia/`.
- Os campos modelo e turno são transitórios. Nenhum modelo SQLAlchemy, migration ou regra da
  cartilha foi alterado para a funcionalidade.

### Provedores e fallback

O Jangada faz as chamadas nesta ordem: Gemini (`gemini-3.5-flash-lite`), OpenRouter
(`openrouter/free`) e Claude (`claude-opus-5-5`). A cadeia só inclui provedores configurados.
Um teste simula um modelo Gemini inexistente e confirma que o fallback do Jangada responde por
`openrouter`, sem chamar Claude. O mesmo cenário é coberto no loop do `Agent` com a tool.

A tentativa de executar a comparação diretamente com o ambiente atual terminou antes de qualquer
chamada externa: nenhum provedor estava configurado. Não foram consultadas nem exibidas chaves; por
isso, a resposta dos modelos reais ainda não foi validada.

### Tools consideradas

- **Tool do Agent escolhida:** `criar_tool_calcular_compatibilidades()` em
  `backend/ia/ferramentas.py` prepara uma função local que chama `calcular_compatibilidades()`.
  Ela só calcula compatibilidades dos dados já consultados, sem acessar ou alterar o banco, e
  devolve ao Agent os IDs e campos compatíveis. O backend repete a validação antes de exibir.
- **Tools prontas do Jangada:** nenhuma foi habilitada. `wikipedia_search()` não ajuda a comparar
  avisos privados do sistema e poderia trazer dados irrelevantes. `web_search()` também não
  encontra os dados necessários e consumiria cota de busca do provedor sem benefício para o fluxo.
- **Gravação e envio:** nenhuma tool grava, apaga ou envia dados externos. O Jangada recebe os
  dados preparados pelo backend; a pessoa confere a sugestão antes de registrar.

### Passos e verificações

1. Criar `backend/ia/` com `__init__.py`, `modelos.py`, `ferramentas.py` e `sugestao.py`.
   Executar o pedido diretamente pelo Jangada e pelo `Agent`; simular um modelo Gemini inexistente
   e confirmar que a resposta vem de `provider="openrouter"`.
2. Implementar a comparação local pura e testar compatibilidade e rejeição de candidatos com menos
   de três atributos compatíveis usando dados fictícios.
3. Colocar esquemas, `INSTRUCAO` e funções de IA em `backend/ia/`; manter importações e testes.
4. Fazer `POST /ia/sugestoes` apenas delegar para a função da pasta de IA; verificar HTTP 503 quando
   nenhum provedor responde e ausência de `commit`.
5. Integrar botão, estado de espera, erro, resultado e seleção na triagem; usar a rota existente
   somente após confirmação humana.
6. Documentar o módulo e verificar a arquitetura.

Verificações realizadas: doze testes do backend passaram, incluindo chamada direta simulada, uso da
tool pelo `Agent` e fallback simulado de modelo Gemini inexistente para OpenRouter. A tentativa
direta real foi bloqueada pela ausência de provedores configurados, sem chamada externa.
`npm.cmd run build` no frontend passou; `git diff --check` passou; a interface foi testada
manualmente pelo responsável.

## Funcionalidade

### Sugestão de correspondência entre objeto achado e aviso de perda

**Status:** implementada e integrada à tela de triagem. A chamada real ainda precisa ser validada
com provedores configurados.

### Problema

Rodrigo precisa comparar manualmente as características de um objeto achado com os avisos de
perda registrados durante um festival com muitos visitantes e objetos. A IA ajudará a encontrar
possíveis correspondências, mas a confirmação continuará sendo humana.

Fonte: `docs/BRIEFING.md`, nas seções “Objetivo” e “Perfil da gestão”; `docs/CARTILHA.md`, nas
seções “O negócio” e “Perfil B · Rodrigo”.

### Usuário e tela

- Usuário: Rodrigo, da equipe do balcão.
- Tela: O balcão, integrada ao fluxo de registro de ocorrência.
- Ação: informar as características completas do objeto achado e consultar sugestões.

### Dados de entrada

O formulário envia categoria, cor, marca, descrição do objeto, pavilhão e `noite` (data). Modelo e
turno são informados somente para a consulta e não são persistidos. A descrição alimenta as
características distintivas da comparação.

O turno representa manhã, tarde ou noite. O objeto achado será relacionado a avisos de perda
existentes, sem receber uma decisão automática da IA.

### Resultado na tela

A IA mostra somente sugestões validadas com pelo menos três características compatíveis, ordenadas
com prioridade para avisos `procurando` e depois pela pontuação.

Cada resultado deverá apresentar, no mínimo:

- identificação do aviso;
- características do aviso de perda;
- situação atual;
- justificativa da semelhança;
- indicação de que a sugestão precisa ser conferida por Rodrigo.

O repositório atualmente fornece apenas avisos `procurando`; a validação de respostas ainda marca
como bloqueado um aviso `devolvido` caso esse estado venha a ser incluído futuramente.

### Confirmação humana e continuidade

Rodrigo confirma manualmente qual aviso corresponde ao objeto. A IA não cria ocorrência, não muda
a situação do aviso e não grava dados no banco.

Depois da confirmação, o fluxo existente registra a ocorrência e o serviço aplica as regras:

- objeto achado muda a situação para `aguardando retirada`;
- devolução muda a situação para `devolvido`;
- aviso devolvido recusa novas ocorrências.

Se a IA errar, não encontrar correspondências ou não responder, Rodrigo continuará manualmente pelos
filtros do balcão, abrirá um aviso e registrará a ocorrência sem a sugestão da IA.

### Arquitetura implementada

Para o MVP, um único `Agent` do Jangada recebe os avisos consultados pelo backend e pode usar uma
tool local para calcular compatibilidades. O backend valida e filtra a resposta pelo resultado
determinístico antes de devolvê-la à tela.

Será usada uma chamada de comparação, com esta responsabilidade:

- receber as características do objeto e os avisos selecionados pelo backend;
- comparar os dados;
- retornar as correspondências e suas justificativas.

O Agent não tem acesso direto ao banco nem ferramentas de escrita ou busca externa. O backend
consulta os avisos e valida a resposta. A única tool disponibilizada calcula compatibilidades nos
dados já preparados; não consulta nem altera registros.

Não há justificativa, neste momento, para separar o trabalho em múltiplos agentes. Dividir extração,
comparação e classificação aumentaria a complexidade sem necessidade comprovada.

Uma ferramenta de leitura poderá ser considerada futuramente se o volume exigir consultas em
etapas. Para o MVP, enviar os dados consultados pelo backend é mais simples e mantém controle
explícito sobre os dados compartilhados.

### Provedor

O Jangada isola a chamada aos provedores em `backend/ia/modelos.py`, sem SDK direto do Google ou da
Anthropic. A ordem escolhida é Gemini principal, OpenRouter grátis como primeira reserva e Claude
pago como terceira opção. A configuração e as chaves permanecem no servidor.

### Integração com o backend

`POST /ia/sugestoes` exige perfil de equipe ou administrador, consulta os avisos abertos e devolve
sugestões sem gravar. Se os provedores falharem, responde HTTP 503 e a tela mantém a busca manual.

O registro definitivo continua usando a rota e o serviço de ocorrência já existentes. A regra da
cartilha continua no serviço, e uma sugestão da IA nunca é gravada automaticamente.

## Prompt para teste manual

### Prompt exploratório (histórico)

O bloco abaixo documenta um teste exploratório manual anterior à integração; não é a instrução
enviada pela aplicação. A instrução atual está em `backend/ia/sugestao.py` na constante
`INSTRUCAO`, e o prompt de comparação é montado por `montar_prompt()` em
`backend/ia/ferramentas.py`.

Na aplicação, o Agent recebe avisos consultados pelo backend e dados fictícios ou operacionais do
formulário. A tool local de compatibilidade é fornecida ao Agent; ferramentas de busca web não são
incluídas.

- Papel: encontrar possíveis correspondências entre um objeto achado e avisos de perda.
- Dados recebidos: o objeto achado e a lista de avisos fornecida pelo backend.
- Ferramentas: a tool local `calcular_compatibilidades_da_consulta`; nenhuma busca pronta do
  Jangada.
- Limites: não cria ocorrência, não altera avisos, não decide devolução e não grava dados.
- Confirmação: Rodrigo revisa e confirma o aviso escolhido.

### Instruções prontas para copiar

```text
Você é um agente auxiliar da equipe de achados e perdidos de um festival.

Seu papel é comparar as características de um objeto achado com avisos de perda
fornecidos pelo sistema e sugerir possíveis correspondências para Rodrigo, da
equipe do balcão.

Você não decide a correspondência final. Rodrigo deve revisar os resultados.
Você não cria ocorrências, não altera a situação de avisos, não grava dados e
não chama ferramentas externas.

Você receberá um objeto_achado e uma lista de avisos.

Os campos do objeto_achado são:

- categoria
- cor
- marca
- modelo
- caracteristicas_distintivas
- pavilhao
- turno
- data

Cada aviso possui os mesmos campos, além de:

- id
- situacao

Considere como características do objeto apenas:

- categoria
- cor
- marca
- modelo
- caracteristicas_distintivas

Pavilhão, turno e data não contam para o mínimo de características. Eles servem
para priorizar a análise.

Só inclua um aviso quando houver compatibilidade em pelo menos três campos
diferentes das características do objeto. Não invente valores ausentes.

Quando um campo estiver vazio, ausente ou desconhecido, trate-o como
desconhecido. Ele não aumenta nem diminui a pontuação e não deve ser tratado
como incompatibilidade.

Analise todos os avisos que atenderem ao mínimo de três características
compatíveis.

Ordene os resultados desta forma:

1. avisos com situação "procurando";
2. depois, os demais avisos;
3. dentro de cada grupo, maior pontuação primeiro.

Use uma pontuação numérica de 0 a 10. A pontuação representa somente o grau
comparativo de correspondência entre os dados fornecidos. Ela não representa
certeza e não substitui a conferência humana.

Use pavilhão, turno e data para priorizar avisos com contexto semelhante, mas
não conte esses campos para atingir o mínimo de três características.

Em contexto_priorizado, liste somente os campos entre pavilhao, turno e data
cujos valores coincidam entre o objeto achado e o aviso. Se nenhum coincidir,
retorne uma lista vazia.

Avisos com situação "devolvido" podem ser apresentados para consulta, mas devem
ser marcados como bloqueados para nova ocorrência.

Responda somente com JSON válido, usando este formato:

{
  "resultado": "analise_concluida",
  "mensagem": "Análise concluída. Confira as sugestões antes de registrar a ocorrência.",
  "correspondencias": [
    {
      "aviso_id": 0,
      "pontuacao": 0,
      "situacao": "procurando",
      "caracteristicas_compativeis": [
        "categoria",
        "cor",
        "marca"
      ],
      "contexto_priorizado": [
        "pavilhao",
        "turno",
        "data"
      ],
      "justificativa": "Explique objetivamente as compatibilidades encontradas.",
      "bloqueado_para_nova_ocorrencia": false
    }
  ]
}

Se Rodrigo preencher menos de três características do objeto, não faça a
comparação. Responda:

{
  "resultado": "entrada_insuficiente",
  "mensagem": "Preencha pelo menos três características do objeto para iniciar a análise.",
  "correspondencias": []
}

Se a entrada estiver fora do assunto de achados e perdidos, não tente responder
ao pedido. Responda:

{
  "resultado": "fora_do_escopo",
  "mensagem": "Posso analisar apenas correspondências entre objetos achados e avisos de perda.",
  "correspondencias": []
}

Se nenhuma correspondência atender ao mínimo de três características, responda
com "analise_concluida", uma mensagem informando que nenhuma correspondência foi
encontrada e uma lista "correspondencias" vazia.

Use somente os dados recebidos. Não invente características, nomes, datas,
situações ou justificativas.
```

### Exemplo fictício de entrada

Este exemplo está separado das instruções para poder ser substituído nos testes. Ele não possui
resultado realizado.

```json
{
  "objeto_achado": {
    "categoria": "oculos",
    "cor": "preto",
    "marca": "VisaoSul",
    "modelo": "retangular",
    "caracteristicas_distintivas": "haste direita com pequeno arranhao",
    "pavilhao": "Pavilhao 2",
    "turno": "tarde",
    "data": "2026-10-14"
  },
  "avisos": [
    {
      "id": 101,
      "categoria": "oculos",
      "cor": "preto",
      "marca": "VisaoSul",
      "modelo": "retangular",
      "caracteristicas_distintivas": "haste direita arranhada",
      "pavilhao": "Pavilhao 2",
      "turno": "tarde",
      "data": "2026-10-14",
      "situacao": "procurando"
    },
    {
      "id": 102,
      "categoria": "oculos",
      "cor": "preto",
      "marca": "OutraMarca",
      "modelo": "redondo",
      "caracteristicas_distintivas": "estojo vermelho",
      "pavilhao": "Pavilhao 2",
      "turno": "manha",
      "data": "2026-10-14",
      "situacao": "devolvido"
    }
  ]
}
```

### Testes manuais realizados

Os resultados abaixo foram fornecidos pelo teste manual do prompt com dados fictícios. Eles não
validam a integração via API, a execução de ferramentas ou a coordenação de agentes.

1. **Normal**

   Entrada: objeto com categoria `oculos`, cor `preto`, marca `VisaoSul`, modelo `retangular`,
   característica distintiva de haste arranhada, pavilhão 2, turno da tarde e data `2026-10-14`.
   O aviso 101 tinha as cinco características compatíveis e situação `procurando`; o aviso 102
   tinha somente duas características compatíveis e situação `devolvido`.

   Resultado fornecido:

   - `resultado`: `analise_concluida`;
   - somente o aviso 101 foi retornado;
   - pontuação `10`;
   - cinco características compatíveis foram listadas;
   - pavilhão, turno e data coincidentes foram usados como contexto;
   - o aviso devolvido não foi retornado por ter menos de três características compatíveis.

   Observação: o caso confirmou JSON válido, justificativa, pontuação e prioridade para
   `procurando`.

2. **Vaga**

   Entrada: somente `categoria` e `cor` preenchidas; marca, modelo e características distintivas
   vazias. Pavilhão, turno e data foram preenchidos, mas não contam para o mínimo.

   Resultado fornecido:

   ```json
   {
     "resultado": "entrada_insuficiente",
     "mensagem": "Preencha pelo menos três características do objeto para iniciar a análise.",
     "correspondencias": []
   }
   ```

   Observação: o agente não analisou o aviso, não contou o contexto como característica e não
   inventou dados.

3. **Fora do assunto**

   Entrada: `Qual é a previsão do tempo para o festival amanhã?`

   Resultado fornecido:

   ```json
   {
     "resultado": "fora_do_escopo",
     "mensagem": "Posso analisar apenas correspondências entre objetos achados e avisos de perda.",
     "correspondencias": []
   }
   ```

   Observação: o agente recusou o assunto fora do escopo e manteve o mesmo formato de resposta.

### Ajuste após os testes

O caso normal revelou uma necessidade de precisão: `contexto_priorizado` poderia ser interpretado
como a lista de todos os campos de contexto recebidos, mesmo quando algum valor não coincidisse.
O prompt final agora instrui a listar somente pavilhão, turno e data coincidentes, ou uma lista vazia
quando nenhum deles coincidir.
