import { ErroNaoAutenticado, ErroSemPermissao, comTratamento, type ApiResult } from '../erros'
import type { Perfil, UsuarioPublico } from '../db/usuarios_repository'

// ---------------------------------------------------------------------------
// PERMISSÕES — único lugar onde se decide "quem pode o quê".
// O nome da ação é o mesmo do canal IPC (ex.: 'alunos:excluir').
// Para liberar ou bloquear algo para a recepção, é só mexer nesta lista.
// ---------------------------------------------------------------------------
const PERMISSOES: Record<Perfil, readonly string[] | '*'> = {
  admin: '*',
  recepcao: [
    'db:test-connection',
    'alunos:listar',
    'alunos:criar',
    'alunos:atualizar',
    'planos:listar',
    'matriculas:listar',
    'matriculas:criar'
  ]
}

export type Sessao = { usuario: UsuarioPublico; permissoes: string[] }

// A sessão vive só na memória do processo main: o renderer nunca recebe token nem senha.
let usuarioAtual: UsuarioPublico | null = null

export function permissoesDe(perfil: Perfil): string[] {
  const lista = PERMISSOES[perfil]
  return lista === '*' ? ['*'] : [...lista]
}

export function iniciarSessao(usuario: UsuarioPublico): Sessao {
  usuarioAtual = usuario
  return { usuario, permissoes: permissoesDe(usuario.perfil) }
}

export function encerrarSessao(): void {
  usuarioAtual = null
}

export function sessaoAtual(): Sessao | null {
  return usuarioAtual
    ? { usuario: usuarioAtual, permissoes: permissoesDe(usuarioAtual.perfil) }
    : null
}

export function exigirPermissao(acao: string): UsuarioPublico {
  if (!usuarioAtual) throw new ErroNaoAutenticado()

  const lista = PERMISSOES[usuarioAtual.perfil]
  if (lista !== '*' && !lista.includes(acao)) throw new ErroSemPermissao()

  return usuarioAtual
}

// Use no lugar de comTratamento em todo handler que exige login.
export function comAcesso<T>(acao: string, operacao: () => Promise<T>): Promise<ApiResult<T>> {
  return comTratamento(acao, async () => {
    exigirPermissao(acao)
    return await operacao()
  })
}
