-- PostgreSQL: execute no SQL Editor do projeto Supabase usado pela API.
-- Se o ambiente local usa o mesmo banco, basta executar uma vez.

-- Confira a conta escolhida sem consultar senha ou outros dados de autenticação.
SELECT id, nome, email, tipo
FROM usuarios
WHERE LOWER(email) = 'kaahbreis@hotmail.com';

-- Libera somente a conta indicada para operar o balcão e registrar ocorrências.
-- A subconsulta identifica a conta; se houver e-mails duplicados por diferença
-- de maiúsculas, o PostgreSQL recusa a operação em vez de escolher uma conta.
UPDATE usuarios
SET tipo = 'equipe'
WHERE id = (
    SELECT id
    FROM usuarios
    WHERE LOWER(email) = 'kaahbreis@hotmail.com'
)
  AND tipo = 'visitante'
RETURNING id, nome, email, tipo;

-- O resultado deve mostrar a conta com tipo equipe; nenhum resultado indica conta ausente.
SELECT id, nome, email, tipo
FROM usuarios
WHERE LOWER(email) = 'kaahbreis@hotmail.com';
