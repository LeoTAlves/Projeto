# Planejamento do módulo de IA

## Funcionalidade planejada

### Sugestão de correspondência entre objeto achado e aviso de perda

**Status:** planejada. Ainda não implementada.

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

Os dados serão enviados em campos separados. A lista prevista é: categoria, cor, marca, modelo,
características distintivas, pavilhão, turno e data. Os nomes finais dos campos ainda precisam ser
confirmados `?`.

O turno representa manhã, tarde ou noite. O objeto achado será relacionado a avisos de perda
existentes, sem receber uma decisão automática da IA.

### Resultado na tela

A IA deverá mostrar todos os avisos que tenham alguma semelhança, ordenados por relevância. Avisos
com situação `procurando` terão prioridade.

Cada resultado deverá apresentar, no mínimo:

- identificação do aviso;
- características do aviso de perda;
- situação atual;
- justificativa da semelhança;
- indicação de que a sugestão precisa ser conferida por Rodrigo.

Avisos com situação `devolvido` poderão aparecer para consulta, mas ficarão bloqueados para uma
nova ocorrência, conforme a regra da cartilha.

O critério mínimo para considerar uma semelhança ainda precisa ser definido `?`.

### Confirmação humana e continuidade

Rodrigo confirma manualmente qual aviso corresponde ao objeto. A IA não cria ocorrência, não muda
a situação do aviso e não grava dados no banco.

Depois da confirmação, o fluxo existente registra a ocorrência e o serviço aplica as regras:

- objeto achado muda a situação para `aguardando retirada`;
- devolução muda a situação para `devolvido`;
- aviso devolvido recusa novas ocorrências.

Se a IA errar, não encontrar correspondências ou não responder, Rodrigo continuará manualmente pelos
filtros do balcão, abrirá um aviso e registrará a ocorrência sem a sugestão da IA.

### Arquitetura planejada

Para o MVP, uma chamada ao modelo é suficiente. O backend consultará os avisos, enviará os dados
estruturados juntamente com as características do objeto e receberá identificadores, relevância e
justificativas.

Será usado um único agente de comparação, com esta responsabilidade:

- receber as características do objeto e os avisos selecionados pelo backend;
- comparar os dados;
- retornar as correspondências e suas justificativas.

O agente não terá acesso direto ao banco e não terá ferramenta de escrita. O backend será responsável
por consultar os avisos e validar qualquer operação posterior.

Não há justificativa, neste momento, para separar o trabalho em múltiplos agentes. Dividir extração,
comparação e classificação aumentaria a complexidade sem necessidade comprovada.

Um agente com ferramentas de leitura poderá ser considerado futuramente se o volume de avisos exigir
consultas em etapas. Para o MVP, enviar os dados consultados pelo backend é mais simples `?`.

### Provedor

O provedor ainda não foi escolhido `?`. A integração deverá ficar isolada em uma camada própria para
permitir avaliar OpenAI, Claude, Gemini ou outro provedor sem alterar as rotas e a regra do serviço.

Os critérios de comparação serão resposta estruturada, qualidade das correspondências, limite de
contexto, latência, política de dados e facilidade de troca. Não foram assumidos preços ou
disponibilidade.

### Integração prevista com o backend

Será necessária uma operação protegida para solicitar sugestões `?`. Ela deverá apenas consultar os
avisos e devolver resultados para a tela.

O registro definitivo continuará usando a rota e o serviço de ocorrência já existentes. A regra da
cartilha continuará no serviço, e uma sugestão da IA nunca será gravada automaticamente.

## Prompt para teste manual

### Agente

Será usado um único agente de comparação.

- Papel: encontrar possíveis correspondências entre um objeto achado e avisos de perda.
- Dados recebidos: o objeto achado e a lista de avisos fornecida pelo backend.
- Ferramentas: nenhuma. O agente não consulta o banco diretamente.
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
