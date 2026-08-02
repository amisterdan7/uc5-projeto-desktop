import { pool } from './connection'

export async function listarTabelas(): Promise<string[]> {
  const result = await pool.query(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
  )
  return result.rows.map((row) => row.table_name)
}
