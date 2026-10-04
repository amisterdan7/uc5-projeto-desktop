import { ipcMain } from 'electron'
import { ErroValidacao, comTratamento } from '../erros'
import {
  alterarAtivo,
  buscarPorLogin,
  contarUsuarios,
  criarPrimeiroAdmin,
  criarUsuario,
  garantirTabelaUsuarios,
  listarUsuarios,
  type NovoUsuario,
  type Perfil,
  type UsuarioPublico
} from '../db/usuarios_repository'
import { conferirSenha } from './senha'
import { comAcesso, encerrarSessao, iniciarSessao, sessaoAtual } from './sessao'

// Proteção contra tentativas em sequência (força bruta)
const MAX_FALHAS = 5
const BLOQUEIO_MS = 60_000
const tentativas = new Map<string, { falhas: number; bloqueadoAte: number }>()

// Hash que nunca confere: faz o tempo de resposta ser igual quando o usuário não existe.
const HASH_FALSO = `${'00'.repeat(16)}:${'00'.repeat(64)}`

function registrarFalha(chave: string): void {
  const atual = tentativas.get(chave) ?? { falhas: 0, bloqueadoAte: 0 }
  atual.falhas += 1
  if (atual.falhas >= MAX_FALHAS) {
    atual.falhas = 0
    atual.bloqueadoAte = Date.now() + BLOQUEIO_MS
  }
  tentativas.set(chave, atual)
}

async function autenticar(dados: unknown): Promise<UsuarioPublico> {
  const { login, senha } = (dados ?? {}) as { login?: unknown; senha?: unknown }
  const chave = String(login ?? '')
    .trim()
    .toLowerCase()
  const senhaDigitada = String(senha ?? '')

  if (!chave || !senhaDigitada) throw new ErroValidacao('Informe usuário e senha.')

  const bloqueio = tentativas.get(chave)
  if (bloqueio && bloqueio.bloqueadoAte > Date.now()) {
    const segundos = Math.ceil((bloqueio.bloqueadoAte - Date.now()) / 1000)
    throw new ErroValidacao(`Muitas tentativas. Tente novamente em ${segundos} segundos.`)
  }

  const encontrado = await buscarPorLogin(chave)
  const senhaOk = await conferirSenha(senhaDigitada, encontrado?.senha_hash ?? HASH_FALSO)

  if (!encontrado || !senhaOk) {
    registrarFalha(chave)
    throw new ErroValidacao('Usuário ou senha incorretos.')
  }

  if (!encontrado.ativo) {
    throw new ErroValidacao('Este usuário está desativado. Fale com um administrador.')
  }

  tentativas.delete(chave)
  return {
    id: encontrado.id,
    nome: encontrado.nome,
    login: encontrado.login,
    perfil: encontrado.perfil,
    ativo: encontrado.ativo
  }
}

// Validação de dados vindos do renderer (nunca confie no que chega por IPC)
function validarNovoUsuario(dados: unknown, perfil: Perfil): NovoUsuario {
  const d = (dados ?? {}) as Record<string, unknown>
  const nome = String(d.nome ?? '').trim()
  const login = String(d.login ?? '')
    .trim()
    .toLowerCase()
  const senha = String(d.senha ?? '')

  if (nome.length < 3) throw new ErroValidacao('Informe o nome completo.')
  if (!/^[a-z0-9._-]{3,30}$/.test(login)) {
    throw new ErroValidacao(
      'O usuário deve ter de 3 a 30 caracteres, usando letras, números, ponto, hífen ou sublinhado.'
    )
  }
  if (senha.length < 8) throw new ErroValidacao('A senha deve ter pelo menos 8 caracteres.')

  return { nome, login, senha, perfil }
}

// Canais IPC
export function registrarIpcAuth(): void {
  // Acesso (não exigem login, claro)
  ipcMain.handle('auth:precisa-setup', () =>
    comTratamento('auth:precisa-setup', async () => {
      await garantirTabelaUsuarios()
      return (await contarUsuarios()) === 0
    })
  )

  ipcMain.handle('auth:criar-primeiro-admin', (_e, dados) =>
    comTratamento('auth:criar-primeiro-admin', async () => {
      const novo = validarNovoUsuario(dados, 'admin')
      return iniciarSessao(await criarPrimeiroAdmin(novo))
    })
  )

  ipcMain.handle('auth:login', (_e, dados) =>
    comTratamento('auth:login', async () => iniciarSessao(await autenticar(dados)))
  )

  ipcMain.handle('auth:logout', () =>
    comTratamento('auth:logout', async () => {
      encerrarSessao()
    })
  )

  // Permite o renderer recarregar (Ctrl+R) sem deslogar a pessoa.
  ipcMain.handle('auth:sessao', () => comTratamento('auth:sessao', async () => sessaoAtual()))

  // Gestão de usuários (somente quem tem permissão; hoje, só administrador)
  ipcMain.handle('usuarios:listar', () =>
    comAcesso('usuarios:listar', async () => await listarUsuarios())
  )

  ipcMain.handle('usuarios:criar', (_e, dados) =>
    comAcesso('usuarios:criar', async () => {
      const perfil = (dados as { perfil?: unknown } | null)?.perfil
      if (perfil !== 'admin' && perfil !== 'recepcao') throw new ErroValidacao('Perfil inválido.')
      return await criarUsuario(validarNovoUsuario(dados, perfil))
    })
  )

  ipcMain.handle('usuarios:alterar-ativo', (_e, id, ativo) =>
    comAcesso('usuarios:alterar-ativo', async () => {
      if (!Number.isInteger(id)) throw new ErroValidacao('Usuário inválido.')
      if (!ativo && id === sessaoAtual()?.usuario.id) {
        throw new ErroValidacao('Você não pode desativar o próprio usuário.')
      }
      return await alterarAtivo(id, Boolean(ativo))
    })
  )
}
