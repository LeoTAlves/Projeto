-- Execute no Workbench depois de criar as tabelas, em um banco novo.
-- Lúcia usa o id 1, já enviado pela tela de visitante; Rodrigo representa a equipe.
USE cade;
INSERT INTO usuarios (id, nome, tipo)
VALUES (1, 'Lúcia', 'visitante'), (2, 'Rodrigo', 'equipe');
