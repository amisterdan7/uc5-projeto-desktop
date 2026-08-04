import { pool } from './connection'

export interface Matricula {
  id: number
  id_aluno: number
  id_plano: number
  data_inicio: string
  data_fim: string
  // valor_pago: number;
  status: 'ativa' | 'inativa'
}

export async function criarMatricula(
  matricula: Omit<Matricula, 'id' | 'status' | 'data_fim'>
): Promise<Matricula> {
  const planoResult = await pool.query(`SELECT duracao_meses FROM planos WHERE id = $1`, [
    matricula.id_plano
  ])

  const duracaoMeses = planoResult.rows[0]?.duracao_meses ?? 1

  const result = await pool.query(
    `INSERT INTO matriculas (id_aluno, id_plano, data_inicio, data_fim_estimada, status)
     VALUES ($1, $2, $3, $3::date + ($4 || ' months')::interval, 'ativa')
     RETURNING *`,
    [matricula.id_aluno, matricula.id_plano, matricula.data_inicio, duracaoMeses]
  )
  return result.rows[0]
}

export async function listarMatriculas(): Promise<
  (Matricula & { aluno_nome: string; plano_nome: string })[]
> {
  const result = await pool.query(`
    SELECT m.*, a.nome AS aluno_nome, p.nome AS plano_nome
    FROM matriculas m
    JOIN alunos a ON a.id = m.id_aluno
    JOIN planos p ON p.id = m.id_plano
    ORDER BY m.data_inicio DESC
  `)
  return result.rows
}

export async function atualizarStatusMatricula(
  id: number,
  status: 'ativa' | 'inativa'
): Promise<void> {
  await pool.query(`UPDATE matriculas SET status = $1 WHERE id = $2 `, [status, id])
}

export async function excluirMatricula(id: number): Promise<void> {
  await pool.query('DELETE  FROM matriculas WHERE id = $1', [id])
}
