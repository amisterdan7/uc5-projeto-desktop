import { randomBytes, scrypt, timingSafeEqual } from 'crypto'

const TAMANHO_CHAVE = 64

function derivarChave(senha: string, salt: Buffer, tamanho: number): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(senha, salt, tamanho, (erro, chave) => (erro ? reject(erro) : resolve(chave)))
  })
}

// Formato guardado no banco: "<salt em hex>:<hash em hex>"
export async function gerarHash(senha: string): Promise<string> {
  const salt = randomBytes(16)
  const hash = await derivarChave(senha, salt, TAMANHO_CHAVE)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export async function conferirSenha(senha: string, armazenado: string): Promise<boolean> {
  const [saltHex, hashHex] = armazenado.split(':')
  if (!saltHex || !hashHex) return false

  const esperado = Buffer.from(hashHex, 'hex')
  const calculado = await derivarChave(senha, Buffer.from(saltHex, 'hex'), esperado.length)
  return timingSafeEqual(calculado, esperado)
}
