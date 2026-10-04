// ATENÇÃO: ajuste o import abaixo se o seu ./connection exporta o Pool com outro nome.
import { pool } from './connection'
import { ErroValidacao } from '../erros'
import { gerarHash } from '../auth/senha'

export type Perfil = 'admin' | 'recepcao'

export type UsuarioPublico = {
  id: number
  nome: string
  login: string
  perfil: Perfil
  ativo: boolean
}

export type UsuarioComSenha = UsuarioPublico & { senha_hash: string }

export type NovoUsuario = { nome: string; login: string; senha: string; perfil: Perfil }

const COLUNAS_PUBLICAS = 'id, nome, login, perfil, ativo'

export async function garantirTabelaUsuarios(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id         SERIAL PRIMARY KEY,
      nome       VARCHAR(100) NOT NULL,
      login      VARCHAR(30)  NOT NULL UNIQUE,
      senha_hash TEXT         NOT NULL,
      perfil     VARCHAR(20)  NOT NULL CHECK (perfil IN ('admin', 'recepcao')),
      ativo      BOOLEAN      NOT NULL DEFAULT TRUE,
      criado_em  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `)
}

export async function contarUsuarios(): Promise<number> {
  const r = await pool.query<{ total: string }>('SELECT COUNT(*) AS total FROM usuarios')
  return Number(r.rows[0]?.total ?? 0)
}

export async function buscarPorLogin(login: string): Promise<UsuarioComSenha | null> {
  const r = await pool.query<UsuarioComSenha>(
    `SELECT ${COLUNAS_PUBLICAS}, senha_hash FROM usuarios WHERE login = $1`,
    [login]
  )
  return r.rows[0] ?? null
}

export async function listarUsuarios(): Promise<UsuarioPublico[]> {
  const r = await pool.query<UsuarioPublico>(
    `SELECT ${COLUNAS_PUBLICAS} FROM usuarios ORDER BY nome`
  )
  return r.rows
}

export async function criarPrimeiroAdmin(dados: NovoUsuario): Promise<UsuarioPublico> {
  const hash = await gerarHash(dados.senha)
  const r = await pool.query<UsuarioPublico>(
    `INSERT INTO usuarios (nome, login, senha_hash, perfil)
     SELECT $1::varchar, $2::varchar, $3::text, 'admin'
     WHERE NOT EXISTS (SELECT 1 FROM usuarios)
     RETURNING ${COLUNAS_PUBLICAS}`,
    [dados.nome, dados.login, hash]
  )
  const criado = r.rows[0]
  if (!criado) throw new ErroValidacao('O administrador inicial já foi criado. Faça login.')
  return criado
}

export async function criarUsuario(dados: NovoUsuario): Promise<UsuarioPublico> {
  const hash = await gerarHash(dados.senha)
  try {
    const r = await pool.query<UsuarioPublico>(
      `INSERT INTO usuarios (nome, login, senha_hash, perfil)
       VALUES ($1, $2, $3, $4)
       RETURNING ${COLUNAS_PUBLICAS}`,
      [dados.nome, dados.login, hash, dados.perfil]
    )
    return r.rows[0]
  } catch (erro) {
    if ((erro as { code?: string }).code === '23505') {
      throw new ErroValidacao('Esse usuário já existe. Escolha outro login.')
    }
    throw erro
  }
}

export async function alterarAtivo(id: number, ativo: boolean): Promise<UsuarioPublico> {
  const r = await pool.query<UsuarioPublico>(
    `UPDATE usuarios SET ativo = $2 WHERE id = $1 RETURNING ${COLUNAS_PUBLICAS}`,
    [id, ativo]
  )
  const atualizado = r.rows[0]
  if (!atualizado) throw new ErroValidacao('Usuário não encontrado.')
  return atualizado
}
