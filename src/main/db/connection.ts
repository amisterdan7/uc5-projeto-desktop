import { Pool } from 'pg'
import dotenv from 'dotenv'
import { app } from 'electron'
import { join } from 'path'

const caminhoEnv = app.isPackaged
  ? join(process.resourcesPath, '.env')
  : join(app.getAppPath(), '.env')

dotenv.config({ path: caminhoEnv })

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
