# Próximos passos

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
