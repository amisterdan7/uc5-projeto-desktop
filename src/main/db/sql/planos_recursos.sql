CREATE TABLE plano_recursos (
  id SERIAL PRIMARY KEY,
  id_plano INTEGER NOT NULL REFERENCES planos(id),
  descricao VARCHAR(100) NOT NULL,
  ordem INTEGER NOT NULL DEFAULT 0
);


INSERT INTO plano_recursos (id_plano, descricao, ordem) VALUES
  ((SELECT id FROM planos WHERE nome = 'Plano Mister'), 'Acesso ilimitado a todas as unidades', 1),
  ((SELECT id FROM planos WHERE nome = 'Plano Mister'), 'Avaliação física mensal', 2),
  ((SELECT id FROM planos WHERE nome = 'Plano Mister'), 'App MisterFit', 3),
  ((SELECT id FROM planos WHERE nome = 'Plano Mister'), 'Personal trainer incluso', 4),
  ((SELECT id FROM planos WHERE nome = 'Plano Mister'), 'Acesso à área VIP', 5),
  ((SELECT id FROM planos WHERE nome = 'Plano Fit'), 'Acesso ilimitado a todas as unidades', 1),
  ((SELECT id FROM planos WHERE nome = 'Plano Fit'), 'Avaliação física mensal', 2),
  ((SELECT id FROM planos WHERE nome = 'Plano Fit'), 'App MisterFit', 3),
  ((SELECT id FROM planos WHERE nome = 'Plano Basic'), 'Acesso às unidades selecionadas', 1),
  ((SELECT id FROM planos WHERE nome = 'Plano Basic'), 'App MisterFit', 2);