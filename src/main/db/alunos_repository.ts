import { pool } from './connection'

export interface Aluno {
  id: number
  nome: string
  data_nascimento: string
  telefone: string
}

export interface AlunoListado extends Aluno {
  plano_nome: string | null
  status_matricula: 'ativa' | 'inativa' | 'vencida' | 'sem_matricula'
}

export async function criarAluno(aluno: Omit<Aluno, 'id'>): Promise<Aluno> {
  const result = await pool.query(
    `INSERT INTO alunos (nome, data_nascimento, telefone)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [aluno.nome, aluno.data_nascimento, aluno.telefone]
  )
  return result.rows[0]
}

export async function listarAlunos(): Promise<AlunoListado[]> {
  const result = await pool.query(`
    SELECT
      a.id, a.nome, a.data_nascimento, a.telefone, a.ativo,
      p.nome AS plano_nome,
      CASE
        WHEN m.id IS NULL THEN 'sem_matricula'
        WHEN m.status = 'inativa' THEN 'inativa'
        WHEN m.data_fim_estimada < CURRENT_DATE THEN 'vencida'
        ELSE 'ativa'
      END AS status_matricula
    FROM alunos a
    LEFT JOIN LATERAL (
      SELECT * FROM matriculas mm WHERE mm.id_aluno = a.id ORDER BY mm.data_inicio DESC LIMIT 1
    ) m ON true
    LEFT JOIN planos p ON p.id = m.id_plano
    ORDER BY a.nome
  `)
  return result.rows
}

export async function atualizarAluno(id: number, aluno: Omit<Aluno, 'id'>): Promise<Aluno> {
  const result = await pool.query(
    `UPDATE alunos SET nome = $1, data_nascimento = $2, telefone = $3
     WHERE id = $4
     RETURNING *`,
    [aluno.nome, aluno.data_nascimento, aluno.telefone, id]
  )
  return result.rows[0]
}

export async function excluirAluno(id: number): Promise<void> {
  await pool.query(`DELETE FROM alunos WHERE id = $1`, [id])
}

export async function desativarAlunoTemporariamente(id: number): Promise<void> {
  await pool.query(`UPDATE alunos SET ativo = FALSE WHERE id = $1`, [id])
}

export async function reativarAluno(id: number): Promise<void> {
  await pool.query(`UPDATE alunos SET ativo = TRUE WHERE id = $1`, [id])
}
