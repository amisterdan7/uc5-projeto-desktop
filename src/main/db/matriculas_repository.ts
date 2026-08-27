import { pool } from './connection'

export interface Matricula {
  id: number
  id_aluno: number
  id_plano: number
  data_inicio: string
  data_fim: string
  status: 'ativa' | 'inativa'
}

export interface MatriculaComNomes extends Matricula {
  aluno_nome: string
  plano_nome: string
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

export async function listarMatriculas(): Promise<MatriculaComNomes[]> {
  const result = await pool.query(`
    SELECT 
      m.id,
      m.id_aluno,
      m.id_plano,
      m.data_inicio,
      m.data_fim_estimada,
      -- O BANCO CALCULA O STATUS AQUI:
      CASE
        WHEN m.status = 'inativa' THEN 'inativa'
        WHEN m.data_fim_estimada < CURRENT_DATE THEN 'vencida'
        ELSE 'ativa'
      END as status,
      a.nome as aluno_nome,
      p.nome as plano_nome
    FROM matriculas m
    LEFT JOIN alunos a ON m.id_aluno = a.id
    LEFT JOIN planos p ON m.id_plano = p.id
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
