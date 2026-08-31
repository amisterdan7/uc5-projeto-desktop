-- Tabela de planos (Básico, Premium, etc.)
CREATE TABLE planos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(50) NOT NULL,
  preco NUMERIC(10,2) NOT NULL,
  duracao_meses INTEGER NOT NULL,
  descricao TEXT,
  destaque BOOLEAN DEFAULT FALSE
);

-- Planos
INSERT INTO planos (nome, preco, duracao_meses, descricao, destaque) VALUES
  ('Plano Mister', 159.90, 12, 'Acesso completo a todas as unidades e benefícios premium.', true),
  ('Plano Fit', 99.90, 6, 'O plano mais econômico para treinar quando quiser.', false),
  ('Plano Basic', 59.90, 3, 'Ideal para quem está começando a jornada fitness.', false);