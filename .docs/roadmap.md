# Roadmap

## Estado atual

O projeto possui as telas principais da cartilha, persistência no MySQL, autenticação no backend,
grupos de acesso, regras de avisos e ocorrências e paginação da listagem.

## Módulo de IA

### Objetivo e estado

Ajudar Rodrigo, da equipe do balcão, a comparar um objeto achado com avisos de perda. A IA apenas
sugere correspondências; Rodrigo confere e confirma antes de registrar uma ocorrência.

Implementado na pasta `backend/ia/`, na rota `POST /ia/sugestoes` e na tela de triagem. A operação
somente consulta dados e retorna sugestões. Se todos os provedores falharem, responde HTTP 503 e a
busca manual continua disponível. O roteiro, as ferramentas consideradas e as verificações estão
em `.docs/ia.md`.

### Fluxo implementado

1. Consultar avisos de perda abertos pelo repositório, sem alterar registros.
2. Calcular compatibilidades locais; aceitar somente candidatos com pelo menos três características
   compatíveis.
3. Enviar os dados selecionados ao Jangada e validar a resposta antes de apresentá-la.
4. Exibir pontuação e explicação na triagem e permitir que Rodrigo confira e selecione o aviso.
5. Registrar somente depois da confirmação, usando o fluxo existente de ocorrências.

### Provedores e ferramentas

- Usar Gemini como principal, OpenRouter grátis como primeira reserva e Claude pago como terceira
  opção, todos pela biblioteca Jangada.
- Usar `calcular_compatibilidades()` como função local de cálculo; não consultar o banco por uma
  tool do modelo.
- Não habilitar `wikipedia_search()` nem `web_search()`: não ajudam a comparar avisos privados, e a
  busca web consumiria cota sem utilidade para o caso.
- Não usar streaming, múltiplos agentes, MCP, RAG, LangChain ou outro orquestrador.

### Verificações e limite atual

- Dez testes do backend passaram, incluindo fallback simulado de Gemini para OpenRouter, cálculo
  local, HTTP 503 e ausência de gravação automática.
- `npm.cmd run build` passou no frontend; o responsável também confirmou o teste manual da tela.
- Não foi feita chamada real aos provedores; a disponibilidade dos modelos ainda requer validação
  quando o responsável configurar o ambiente.

### Próximas verificações

- Validar uma chamada real apenas quando o responsável configurar os provedores no ambiente.
- Acompanhar a qualidade das sugestões e ajustar o cálculo com dados fictícios ou autorizados.

## Outros itens

Manter as regras da cartilha e os fluxos existentes. Qualquer futura alteração de persistência deve
ser planejada separadamente; os campos transitórios modelo e turno não foram adicionados aos modelos
nem às migrations.
