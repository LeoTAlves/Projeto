# Roadmap

## Estado atual

O projeto possui as telas principais da cartilha, persistência no MySQL, autenticação no backend,
grupos de acesso, regras de avisos e ocorrências e paginação da listagem.

## Pendências antes do módulo de IA

- Integrar o login ao frontend e enviar o token nas chamadas protegidas.
- Confirmar como os campos estruturados do objeto achado serão representados nas telas, esquemas e
  banco.
- Confirmar o provedor da API de IA; OpenAI é a proposta atual, mas a decisão continua pendente.

## Módulo de IA

### Objetivo do MVP

Ajudar Rodrigo, da equipe do balcão, a comparar um objeto achado com avisos de
perda. A IA apenas sugere correspondências. Rodrigo confirma o resultado antes de
registrar uma ocorrência.

A funcionalidade continua planejada e não possui implementação.

### Tarefas do MVP

1. **Integrar o login ao frontend.**

   - Fazer: criar o formulário de e-mail e senha, guardar o token durante a
     sessão, enviar `Authorization: Bearer ...` nas chamadas protegidas e escolher
     a tela pelo grupo retornado em `GET /usuarios/eu`.
   - Afeta: `frontend/src/App.jsx`, `frontend/src/servicos/api.js` e
     `frontend/src/telas/autenticacao/Login.jsx` (novo, proposto).
   - Verificar: entrar como `visitante` e como `equipe`; conferir que cada perfil
     vê somente suas telas e que as rotas protegidas deixam de retornar `401` após
     o login.

2. **Definir os dados estruturados dos avisos.**

   - Fazer: decidir como categoria, cor, marca, modelo, características
     distintivas, pavilhão, turno e data serão representados. Confirmar se o campo
     atual `noite` continuará representando a data ou se haverá mudança de nome `?`.
   - Afeta: `backend/modelos/aviso.py`, `backend/esquemas/aviso.py`,
     `frontend/src/telas/pessoa/registrar-perda/RegistrarPerda.jsx` e uma nova
     migration em `backend/migracoes/versions/` (novo, proposto).
   - Verificar: cadastrar um aviso com os campos estruturados, reiniciar a API e
     conferir que os dados continuam disponíveis.

3. **Comparar e escolher o provedor da API.**

   - Fazer: comparar OpenAI, Claude, Gemini ou outro provedor por resposta
     estruturada, qualidade das correspondências, política de dados, latência e
     facilidade de troca. Não fixar modelo, preço ou limite sem confirmação.
   - Afeta: planejamento e configuração do backend.
   - Verificar: registrar a decisão e os motivos em `.docs/ia.md`.
   - Estado: OpenAI é a proposta inicial `?`; a escolha continua pendente.

4. **Preparar a configuração segura da API.**

   - Fazer: adicionar a chave no `backend/.env` local e registrar somente o nome
     no `backend/.env.exemplo`. O nome proposto é `CHAVE_DA_IA` `?`.
   - Afeta: `backend/configuracao.py`, `backend/.env` e
     `backend/.env.exemplo`.
   - Verificar: confirmar que apenas `configuracao.py` lê a variável e que a chave
     não aparece no Git, logs ou documentação.

5. **Criar os esquemas da sugestão.**

   - Fazer: representar o objeto achado, avisos candidatos, pontuação,
     características compatíveis, contexto priorizado, situação e bloqueio de
     avisos `devolvido`.
   - Afeta: `backend/esquemas/ia.py` (novo, proposto).
   - Verificar: validar entrada com menos de três características, entrada completa
     e resposta sem correspondências.

6. **Criar a consulta dos avisos para comparação.**

   - Fazer: buscar os avisos que serão enviados ao agente sem a paginação da tela.
     O repositório continua sendo o único lugar que acessa o modelo e a sessão.
   - Afeta: nova função em `backend/repositorios/aviso.py`.
   - Verificar: conferir que o serviço recebe os avisos necessários e que a
     consulta não altera nenhum registro.

7. **Montar o pedido no serviço de IA.**

   - Fazer: criar o objeto `objeto_achado`, preparar a lista de avisos, inserir o
     prompt revisado de `.docs/ia.md` e enviar somente dados disponíveis.
   - Afeta: `backend/servicos/ia.py` (novo, proposto).
   - Verificar: testar a montagem com dados fictícios e conferir que não há senha,
     token, chave ou dado pessoal real.

8. **Isolar a chamada ao provedor.**

   - Fazer: criar um adaptador para uma chamada ao provedor escolhido e devolver a
     resposta estruturada ao serviço.
   - Afeta: `backend/servicos/provedor_ia.py` (novo, proposto).
   - Verificar: testar resposta válida, JSON inválido, erro HTTP, timeout e
     ausência de resposta.
   - Limite do MVP: uma tentativa por solicitação, sem repetição automática.

9. **Criar a operação protegida de sugestões.**

   - Fazer: criar uma operação somente de leitura para solicitar sugestões, exigindo
     o grupo `equipe` e sem registrar ocorrências.
   - Afeta: nova rota em `backend/rotas/avisos.py` ou
     `backend/rotas/ia.py` (novo, proposto), e `backend/main.py` se houver router
     separado.
   - Caminho proposto: `POST /avisos/sugestoes` `?`.
   - Verificar: visitante recebe `403`, equipe recebe sugestões e nenhum aviso ou
     ocorrência é alterado.

10. **Exibir e revisar as sugestões na tela.**

    - Fazer: permitir que Rodrigo preencha os campos, solicite a análise, veja
      todas as correspondências e confirme manualmente uma delas.
    - Afeta: `frontend/src/telas/gestao/ocorrencia/Ocorrencia.jsx` ou um novo
      componente `frontend/src/componentes/SugestoesCorrespondencia.jsx`
      (novo, proposto).
    - Verificar: conferir pontuação, justificativa, prioridade para `procurando` e
      bloqueio visual de `devolvido`.

11. **Continuar pelo fluxo manual.**

    - Fazer: quando a IA falhar, não encontrar correspondências ou retornar resposta
      inválida, mostrar uma mensagem e manter a seleção manual de avisos.
    - Afeta: `frontend/src/telas/gestao/ocorrencia/Ocorrencia.jsx` e
      `frontend/src/servicos/api.js`.
    - Verificar: simular falha do provedor e registrar uma ocorrência manualmente.

12. **Registrar somente após confirmação.**

    - Fazer: usar a rota atual de ocorrência depois que Rodrigo escolher um aviso.
      A regra continua no serviço existente.
    - Afeta: `backend/rotas/ocorrencias.py`, `backend/servicos/ocorrencia.py` e
      `frontend/src/servicos/api.js`.
    - Verificar: confirmar que a IA não grava sozinha e que aviso `devolvido` ainda
      recusa nova ocorrência.

### Agente e ferramentas

O MVP terá um único agente de comparação.

- Dados: objeto achado e lista de avisos preparada pelo backend.
- Ferramentas: nenhuma.
- Acesso: somente aos dados enviados no pedido.
- Limites: não acessar banco diretamente, gravar dados, criar ocorrências,
  alterar situações ou decidir a correspondência final.
- Ordem: backend consulta, serviço monta, agente compara, frontend exibe e Rodrigo
  confirma.
- Tentativas: uma chamada por solicitação no MVP.
- Encerramento: Rodrigo confirma uma sugestão ou continua manualmente.

Não haverá múltiplos agentes no MVP. Um agente com ferramentas de leitura e uma
divisão entre agentes ficam para melhorias futuras, caso o volume justifique.

### Testes separados

Os testes do prompt registrados em `.docs/ia.md` são manuais e cobrem entrada
normal, entrada vaga e entrada fora do assunto.

Os testes de integração deverão verificar autenticação da equipe, montagem do
pedido, resposta estruturada, JSON inválido, timeout, erro do provedor, ausência
de correspondências, aviso `devolvido`, ausência de gravação automática e
continuidade manual.

### Melhorias futuras

- ferramentas de leitura para volumes maiores;
- múltiplos agentes somente se houver divisão real de responsabilidades;
- política de tentativas e recuperação mais sofisticada;
- calibragem da pontuação;
- registro das sugestões e confirmações para avaliação posterior.

### Dúvidas pendentes

- provedor da API `?`;
- nome final dos campos de data e turno `?`;
- persistência dos campos estruturados do objeto achado na ocorrência `?`;
- tela ou componente final da sugestão `?`;
- caminho final da operação de sugestões `?`.

