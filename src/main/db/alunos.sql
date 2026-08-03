-- Tabela de alunos
CREATE TABLE alunos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  data_nascimento DATE NOT NULL,
  telefone VARCHAR(20)
);

