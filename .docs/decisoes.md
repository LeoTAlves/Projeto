# Decisões

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
