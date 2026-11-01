# Decisões

## Identidade e leitura das situações

- Pedido do responsável: adotar Cadê!? e melhorar o visual sem excesso de elementos.
- A interface usa azul profundo, dourado e fundo claro, com tipografia local,
  cartões discretos e disposição adaptada ao celular.
- `Marca.jsx` centraliza o nome. `Situacao.jsx` identifica situações com cor,
  texto e símbolo: procurando em âmbar, retirada em azul e devolvido em verde.
- Achado e devolução usam o mesmo padrão no histórico e na prévia do formulário.
- A mudança é de apresentação. Não altera dados, rotas, autenticação ou permissões.
- Paleta e aplicação registradas em `docs/styleguide/README.md`.

## Perfil administrador

- Pedido do responsável: a conta indicada em `docs/liberar_admin.sql` será admin
  e poderá cadastrar membros da equipe pelo sistema.
- A administração usa o tipo `admin` armazenado no banco. O e-mail não concede
  privilégios automaticamente no cadastro público nem no navegador.
- `POST /usuarios` exige admin. Os novos usuários da tela recebem tipo `equipe`.
- `UsuarioSaida` aceita admin; `UsuarioCriar` não permite criar outro admin pela API.
- O serviço existente mantém a geração do hash da senha. O cadastro público segue
  criando somente visitantes. CORS e configuração de infraestrutura foram preservados.
- A ativação inicial será feita por SQL no Supabase após publicar o backend.
  Não foi criada rota pública de promoção nem alterada senha de conta existente.
