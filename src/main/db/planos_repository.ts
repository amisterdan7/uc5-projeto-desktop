import { pool } from './connection'

export interface Recurso {
  descricao: string
}

export interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
  descricao: string
  destaque: boolean
  recursos: Recurso[]
}
export interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
}

export async function criarPlano(plano: Omit<Plano, 'id'>): Promise<Plano> {
  const result = await pool.query(
    `INSERT INTO planos (nome, preco, duracao_meses) VALUES ($1, $2, $3) RETURNING *`,
    [plano.nome, plano.preco, plano.duracao_meses]
  )
  return { ...result.rows[0], preco: Number(result.rows[0].preco) }
}

export async function atualizarPlano(id: number, plano: Omit<Plano, 'id'>): Promise<Plano> {
  const result = await pool.query(
    `UPDATE planos SET nome = $1, preco = $2, duracao_meses = $3 WHERE id = $4 RETURNING *`,
    [plano.nome, plano.preco, plano.duracao_meses, id]
  )
  return { ...result.rows[0], preco: Number(result.rows[0].preco) }
}

export async function listarPlanos(): Promise<Plano[]> {
  const result = await pool.query(`
    SELECT
      p.id, p.nome, p.preco, p.duracao_meses, p.descricao, p.destaque,
      COALESCE(
        json_agg(
          json_build_object('descricao', r.descricao)
          ORDER BY r.ordem
        ) FILTER (WHERE r.id IS NOT NULL),
        '[]'
      ) AS recursos
    FROM planos p
    LEFT JOIN plano_recursos r ON r.id_plano = p.id
    GROUP BY p.id
    ORDER BY p.preco DESC
  `)

  return result.rows.map((row) => ({
    ...row,
    preco: Number(row.preco)
  }))
}

export async function excluirPlano(id: number): Promise<void> {
  await pool.query(`DELETE FROM planos WHERE id = $1`, [id])
}
