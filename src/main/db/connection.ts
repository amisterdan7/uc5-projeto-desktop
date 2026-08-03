import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

export const pool = new Pool({
 
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
