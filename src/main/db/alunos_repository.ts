import { pool } from './connection'

export interface Aluno {
  id: number
  nome: string
  data_nascimento: string
  telefone: string
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

export async function listarAlunos(): Promise<Aluno[]> {
  const result = await pool.query(`SELECT * FROM alunos ORDER BY nome`)
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
