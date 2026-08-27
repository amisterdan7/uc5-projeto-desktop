import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export type AppError = { message: string }
export type ApiOk<T> = { success: true; data: T }
export type ApiFail = { success: false; error: AppError }
export type ApiResult<T> = ApiOk<T> | ApiFail

export class ErroValidacao extends Error {}

export function mensagemAmigavel(erro: unknown): string {
  const codigo = (erro as { code?: string } | null)?.code

  if (codigo === '23505') return 'Já existe um registro com esses dados.'
  if (codigo === '23503') return 'Não é possível concluir: há um vínculo com outro registro.'
  if (codigo === '23502') return 'Um campo obrigatório não foi preenchido.'

  const texto = `${codigo ?? ''} ${erro instanceof Error ? erro.message : ''}`

  if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|ECONNRESET|SSL/i.test(texto)) {
    return 'Não foi possível conectar ao banco de dados. Verifique sua internet e tente novamente.'
  }

  return 'Ocorreu um erro inesperado. Tente novamente em instantes.'
}

export function registrarErro(origem: string, erro: unknown): void {
  try {
    const pasta = path.join(app.getPath('userData'), 'logs')
    fs.mkdirSync(pasta, { recursive: true })
    const detalhe = erro instanceof Error ? (erro.stack ?? erro.message) : String(erro)
    const linha = `[${new Date().toISOString()}] [${origem}] ${detalhe}\n`
    fs.appendFileSync(path.join(pasta, 'erros.log'), linha, 'utf-8')
  } catch {
    // Se o log falhar, é ignorado para não derrubar o sistema
  }
}

export async function comTratamento<T>(
  origem: string,
  operacao: () => Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await operacao()
    return { success: true, data }
  } catch (erro) {
    if (erro instanceof ErroValidacao) {
      return { success: false, error: { message: erro.message } }
    }

    registrarErro(origem, erro)
    return { success: false, error: { message: mensagemAmigavel(erro) } }
  }
}
