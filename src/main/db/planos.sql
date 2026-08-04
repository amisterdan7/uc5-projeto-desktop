-- Tabela de planos (Básico, Premium, etc.)
CREATE TABLE planos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao_meses INTEGER NOT NULL
);

INSERT INTO planos (nome, preco, duracao_meses) VALUES
  ('Fit', 69.90, 1),
  ('Mister', 159.90, 1)