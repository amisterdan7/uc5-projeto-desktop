import { pool } from './connection'

export interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
}

export async function criarPlano(plano: Omit<Plano, 'id'>): Promise<Plano> {
  const result = await pool.query(
    'INSERT INTO planos (nome, preco, duracao_meses) VALUES ($1, $2, $3) RETURNING *'[
      (plano.nome, plano.preco, plano.duracao_meses)
    ]
  )
  return result.rows[0]
}

export async function listarPlanos(): Promise<Plano[]> {
  const result = await pool.query(`SELECT * FROM planos ORDER BY preco`)
  return result.rows
}

export async function atualizarPlano(id: number, plano: Omit<Plano, 'id'>): Promise<Plano> {
  const result = await pool.query(
    'UPDATE planos SET nome = $1, preco = $2, duracao_meses = $3 WHERE id = $4 RETURNING *'[
      (plano.nome, plano.preco, plano.duracao_meses, id)
    ]
  )
  return result.rows[0]
}
export async function excluirPlano(id: number): Promise<void> {
  await pool.query('DELETE FROM planos WHERE id = $1', [id])
}