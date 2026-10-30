# Administrador e cadastro da equipe

## Ativação

1. Publique o backend atualizado, que reconhece o tipo `admin`, e o frontend atualizado.
2. Se a conta indicada não existir com senha, crie-a pelo formulário público.
   Se o e-mail já existir sem senha válida, será necessário recuperar a conta antes
   da validação; o SQL de promoção não altera a senha.
3. No SQL Editor do Supabase usado pela API, execute `docs/liberar_admin.sql`.
   Confira que a conta aparece com `tipo = admin`.
4. Saia da aplicação e entre novamente com essa conta.
5. Devem aparecer O balcão, A ocorrência e Cadastrar equipe.

Se o ambiente local usa o mesmo banco, a promoção precisa ser feita uma única vez.
Se usa outro PostgreSQL, execute o comando também nele. Não use o arquivo antigo
`liberar_equipe.sql` para ativar a administração.

## Cadastro e permissões

1. Como admin, abra Cadastrar equipe e preencha nome, e-mail, senha e confirmação.
2. Senhas diferentes devem mostrar uma mensagem e impedir o envio.
3. Um cadastro válido deve mostrar sucesso e limpar o formulário, inclusive as senhas.
4. E-mail repetido deve mostrar o conflito informado pela API.
5. Saia e entre como o membro criado. Ele deve ver O balcão e A ocorrência,
   sem a opção Cadastrar equipe.
6. Entre como visitante. As telas devem continuar sendo Registrar perda e Meus avisos.
7. Uma chamada direta a `POST /usuarios` por visitante ou equipe deve retornar `403`;
   sem autenticação, `401`. Admin pode criar equipe, mas `tipo: admin` retorna `422`.
8. No cadastro público, mesmo enviando `tipo: admin`, a conta criada deve ser visitante.

## Verificações locais realizadas

- `npm run build` passou com a nova tela incluída.
- Funções das rotas e dependências reais foram verificadas diretamente com serviços
  em memória, sem banco ou credenciais. Foram conferidos os perfis no cadastro interno,
  bloqueio de criação de admin,
  cadastro público como visitante, senha curta, conflito de e-mail e acesso a ocorrências.
- A tentativa de teste HTTP local não concluiu; a verificação direta não substitui
  o teste completo de login e cadastro pela aplicação publicada.
- Cadastro real, promoção no Supabase e funcionamento na publicação ainda dependem
  da ativação acima. Nenhuma conta ou senha real foi criada ou alterada nesta verificação.
