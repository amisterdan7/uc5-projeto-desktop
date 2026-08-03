import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    console.log('Conectado ao PostgreSQL com sucesso')
    client.release()
    return true
  } catch (error) {
    console.error('Erro ao conectar ao PostgreSQL:', error)
    return false
  }
}
