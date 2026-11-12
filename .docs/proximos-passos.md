# Próximos passos

## Como reunir as próximas mudanças

Registrar nesta lista cada nova mudança solicitada para o Cadê!?. Aguardar um
pedido explícito para implementar o conjunto de uma vez.

## Rodada autorizada

- Categorias, triagem assistida, fila do balcão, etiquetas, conferência de
  propriedade, correção de vínculos, comprovantes e proteção de login integrados.
- A revisão `b421a63f9d20` foi aplicada e conferida no PostgreSQL. As seis
  variáveis SMTP estão cadastradas em produção na Vercel.
- A comparação local serve como alternativa quando não há provedor de IA
  configurado. Confirmar o funcionamento dos provedores após adicionar uma chave.
- O roteiro de comparação está em `backend/tests/benchmark_triagem.py`. A busca
  por texto encontrou o aviso correto entre os três primeiros em um de dois
  exemplos fictícios. Falta medir a IA com um provedor configurado.

As seções abaixo registram o escopo reunido para esta rodada e o planejamento anterior.

## Ideia para a próxima rodada de mudanças

- Aguardar o pedido de implementação junto com as próximas mudanças do responsável.
  Adicionar uma categoria por objeto, com a mesma lista no registro de perda pelo
  visitante e no registro de achado pelo balcão. Lista inicial: celulares e
  eletrônicos, carteiras e documentos, chaves, óculos, bolsas e mochilas,
  roupas e acessórios e outros.
- Usar a categoria para incluir e priorizar candidatos na triagem, junto com
  os detalhes da descrição. Preservar a busca por texto para avisos antigos sem
  categoria e para casos em que a categoria foi escolhida incorretamente.
  A equipe confirma a correspondência. Uma futura IA pode usar os mesmos dados
  para explicar as sugestões.

## Segurança do login e da retirada

- Aguardar o pedido de implementação junto com as demais mudanças.
- Confirmar o e-mail no cadastro do visitante. Equipe e administrador entram com
  e-mail e senha. O login limita tentativas seguidas e usa mensagem genérica em
  caso de falha.
- Permitir que o visitante informe um detalhe privado do objeto no aviso de perda,
  como um adesivo ou uma marca de desgaste. O balcão confere esse detalhe antes
  de aprovar a retirada, mesmo quando a triagem já apontou uma correspondência.
- Separar a confirmação do achado da aprovação de retirada. Liberar o código em
  Meus avisos somente após a aprovação individual pelo balcão. Vincular o código
  à conta e ao aviso e permitir um único uso.

## Melhorias para o atendimento no balcão

- Registrar o local de guarda e identificar cada objeto com uma etiqueta que
  traga seu número no sistema.
- Comparar achado e aviso de perda lado a lado na triagem, com categoria, cor,
  marca, pavilhão e data.
- Avisar em Meus avisos quando houver um possível achado em conferência ou uma
  retirada aprovada.
- Registrar no histórico quem recebeu o objeto, confirmou o vínculo e fez a
  entrega, com data e hora.

## Duplicidades, pendências e correções

- Avisar sobre possível duplicidade quando o visitante já tiver um aviso em
  aberto com descrição parecida. Oferecer acesso ao aviso existente e permitir
  um novo registro quando forem objetos distintos.
- Criar uma fila no balcão com achados sem triagem, casos em conferência e
  retiradas aprovadas ainda pendentes. Mostrar o tempo em cada situação.
- Permitir que a equipe desfaça um vínculo incorreto antes da entrega.
  Invalidar o código de retirada, reabrir a busca e registrar a correção no
  histórico. Priorizar esta melhoria na próxima rodada.
- Disponibilizar comprovante em Meus avisos após a devolução, com objeto, data
  e balcão responsável. Permitir que a equipe consulte a entrega no histórico.

## IA na próxima rodada

- O backend já expõe `POST /ia/sugestoes` para equipe e administrador, com
  Gemini, OpenRouter e Claude configurados como alternativas no código.
  A triagem do balcão ainda busca por palavras em comum. A integração na tela
  e a chamada real aos provedores precisam ser validadas.
- Priorizar **Buscar sugestões com IA** na triagem. Reaproveitar a rota existente,
  consultar apenas avisos de perda em aberto e mostrar achado e aviso lado a lado,
  com semelhanças e divergências. Manter a busca por texto disponível.
- Sugerir categoria e atributos a partir da descrição, com confirmação de quem
  registra o objeto. Comparar novos avisos aos avisos abertos do próprio
  visitante para sugerir possíveis duplicidades, com opção de seguir o cadastro.
- Excluir detalhes privados de propriedade e códigos de retirada dos dados
  enviados ao modelo. A equipe confirma o achado e aprova a retirada.
- Comparar a triagem atual com a assistida por IA usando dados fictícios com
  sinônimos e objetos parecidos. Medir em quantos casos o aviso correto aparece
  entre os três primeiros resultados.

## Pendências atuais

- Revisar visualmente o novo Cadê!? no computador e no celular e publicar o frontend.
  O build passou e o contraste das etiquetas foi conferido. A prévia no navegador
  não ficou disponível nesta sessão. Conferir login, cadastro, os três perfis,
  as três situações dos avisos e os tipos no histórico de ocorrências.
- Publicar backend e frontend com suporte ao administrador. Criar a conta escolhida
  pelo cadastro público, caso ainda não exista com senha, e executar
  `docs/liberar_admin.sql` no Supabase. Esse comando substitui a promoção anterior
  para equipe. A promoção e a publicação ainda não foram executadas.
- Validar login como admin, cadastro de equipe e login do membro criado conforme
  `docs/TESTES_ADMIN.md`. Se o ambiente local usa o mesmo banco, a promoção vale
  para ambos; caso contrário, repetir no outro PostgreSQL.
- Confirmar o motivo histórico da adoção do MySQL e do Alembic; a hipótese atual é
  exigência da aula `?`.
- Confirmar o provedor da API de IA. OpenAI é a proposta atual `?`; Claude, Gemini
  e outros permanecem como alternativas `?`.
- Definir como os campos estruturados do objeto achado serão representados nas
  telas, esquemas e banco, sem implementar ainda a IA.
- Definir a operação protegida que solicitará sugestões ao agente, mantendo a
  gravação da ocorrência no serviço existente.
- Implementar a funcionalidade planejada somente depois da confirmação do provedor,
  dos campos e da integração do login.

## Preparação da apresentação

- Demonstrar o login e explicar que o backend restringe as rotas pelo grupo do usuário.
- Mostrar que o dono do aviso vem do token, não do corpo da requisição, e relacionar essa escolha
  com a segurança do projeto.
- Apresentar a tela `O balcão` e a tela `A ocorrência`, destacando o filtro por pavilhão e a regra
  que bloqueia novas ocorrências depois da devolução.
- Apresentar a funcionalidade de IA como planejada, sem afirmar que existe implementação ou
  integração com provedor.
- Mostrar o prompt revisado e os três testes manuais fictícios registrados em `.docs/ia.md`.
- Explicar que os testes do prompt não validam API, ferramentas, provedor ou coordenação de agentes.
- Levar para decisão futura o provedor, os campos estruturados, a tela final e a rota de sugestões.

## Onde paramos

O prompt foi definido e testado manualmente com três entradas fictícias. O resultado
foi registrado em `.docs/ia.md`. A integração via API e a implementação da IA ainda
não começaram.
