import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
})

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    console.log('Conectado ao postgress com sucesso')
    client.release()
    return true
  } catch (error) {
    console.log('Erro ao connectar ao Postgress:', error)
    return false
  }
}
