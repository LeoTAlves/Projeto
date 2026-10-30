-- PostgreSQL / Supabase: publique primeiro o backend com suporte ao perfil admin.
-- A conta precisa existir e ter senha criada pelo formulário da aplicação.
-- Este comando não cria usuário nem define ou altera senha.

-- Confirme a conta que receberá a administração.
SELECT id, nome, email, tipo
FROM usuarios
WHERE LOWER(email) = 'kaahbreis@hotmail.com';

-- Promove somente a conta solicitada; duplicidade de e-mail faz a subconsulta falhar.
UPDATE usuarios
SET tipo = 'admin'
WHERE id = (
    SELECT id
    FROM usuarios
    WHERE LOWER(email) = 'kaahbreis@hotmail.com'
)
  AND tipo IN ('visitante', 'equipe')
RETURNING id, nome, email, tipo;

-- Confirme o resultado mesmo se a conta já era administradora.
SELECT id, nome, email, tipo
FROM usuarios
WHERE LOWER(email) = 'kaahbreis@hotmail.com';
