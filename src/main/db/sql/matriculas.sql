
-- Tabela de matrículas (liga aluno a um plano)
CREATE TABLE matriculas (
  id SERIAL PRIMARY KEY,
  id_aluno INTEGER NOT NULL REFERENCES alunos(id),
  id_plano INTEGER NOT NULL REFERENCES planos(id),
  data_inicio DATE NOT NULL,
  data_fim_estimada DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'inativa'))
);

