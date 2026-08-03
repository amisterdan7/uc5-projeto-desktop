-- Tabela de planos (Básico, Premium, etc.)
CREATE TABLE planos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao_meses INTEGER NOT NULL
);

INSERT INTO planos (nome, preco, duracao_meses) VALUES
  ('Básico', 79.90, 1),
  ('Premium', 129.90, 1),
  ('Anual', 899.90, 12);