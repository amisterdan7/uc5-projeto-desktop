import type { ApiResult, Sessao } from './types'
import { irParaView, limparEstado, podeFazer, setSessao } from './state'

type Modo = 'verificando' | 'falha' | 'login' | 'setup'

const PAINEIS: Record<Modo, string> = {
  verificando: 'login-verificando',
  falha: 'login-falha',
  login: 'form-login',
  setup: 'form-setup'
}

const TABELAS_E_LISTAS = [
  'tabela-alunos-body',
  'tabela-matriculas-body',
  'tabela-usuarios-body',
  'planos-grid'
]
const FORMULARIOS = ['form-aluno', 'form-matricula', 'form-usuario']

let aoEntrar: (sessao: Sessao) => Promise<void> = async () => {}

function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T
}

function alternar(modo: Modo): void {
  for (const [nome, id] of Object.entries(PAINEIS)) {
    el(id).hidden = nome !== modo
  }
  if (modo === 'login') el<HTMLInputElement>('login-usuario').focus()
  if (modo === 'setup') el<HTMLInputElement>('setup-nome').focus()
}

function mostrarErro(id: string, mensagem: string): void {
  const caixa = el(id)
  caixa.textContent = mensagem
  caixa.hidden = false
}

function esconderErro(id: string): void {
  el(id).hidden = true
}

function aplicarSessaoNaTela({ usuario }: Sessao): void {
  const partes = usuario.nome.trim().split(/\s+/)
  const primeira = partes[0]?.[0] ?? ''
  const ultima = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? '') : ''

  el('avatar-usuario').textContent = (primeira + ultima).toUpperCase()
  el('nome-usuario').textContent = usuario.nome
  el('perfil-usuario').textContent = usuario.perfil === 'admin' ? 'Administrador' : 'Recepção'

  document.querySelectorAll<HTMLElement>('[data-requer]').forEach((item) => {
    item.hidden = !podeFazer(item.dataset.requer ?? '')
  })
}

async function entrar(sessao: Sessao): Promise<void> {
  setSessao(sessao)
  aplicarSessaoNaTela(sessao)

  el('view-login').hidden = true
  el('app').hidden = false
  irParaView('planos')

  await aoEntrar(sessao)
}

function limparTela(): void {
  TABELAS_E_LISTAS.forEach((id) => el(id)?.replaceChildren())

  FORMULARIOS.forEach((id) => {
    const form = el<HTMLFormElement>(id)
    form?.reset()
    if (form) form.hidden = true
  })

  const busca = el<HTMLInputElement>('input-busca')
  if (busca) busca.value = ''
}

function mostrarFalha(mensagem: string): void {
  el('view-login').hidden = false
  el('login-falha-msg').textContent = mensagem
  alternar('falha')
}

async function mostrarTelaDeAcesso(): Promise<void> {
  el('app').hidden = true
  el('view-login').hidden = false
  alternar('verificando')

  try {
    const resultado = (await window.authAPI.precisaConfigurar()) as ApiResult<boolean>

    if (!resultado.success) {
      mostrarFalha(resultado.error.message)
      return
    }

    alternar(resultado.data ? 'setup' : 'login')
  } catch {
    mostrarFalha('Não foi possível iniciar o acesso. Feche o aplicativo e abra novamente.')
  }
}

async function sair(): Promise<void> {
  await window.authAPI.logout()
  limparEstado()
  limparTela()
  await mostrarTelaDeAcesso()
}

async function enviar(
  form: HTMLFormElement,
  idErro: string,
  tarefa: () => Promise<ApiResult<Sessao>>
): Promise<void> {
  const botao = form.querySelector<HTMLButtonElement>('button[type="submit"]')
  esconderErro(idErro)
  if (botao) botao.disabled = true

  try {
    const resultado = await tarefa()

    if (!resultado.success) {
      mostrarErro(idErro, resultado.error.message)
      return
    }

    form.reset()
    await entrar(resultado.data)
  } catch {
    mostrarErro(idErro, 'Não foi possível concluir o acesso. Tente novamente.')
  } finally {
    if (botao) botao.disabled = false
  }
}

function ligarFormularios(): void {
  const formLogin = el<HTMLFormElement>('form-login')
  const formSetup = el<HTMLFormElement>('form-setup')
  const campoSenha = el<HTMLInputElement>('login-senha')
  const botaoVer = el<HTMLButtonElement>('login-ver-senha')

  botaoVer.addEventListener('click', () => {
    const mostrando = campoSenha.type === 'text'
    campoSenha.type = mostrando ? 'password' : 'text'
    botaoVer.textContent = mostrando ? 'Mostrar' : 'Ocultar'
    botaoVer.setAttribute('aria-pressed', String(!mostrando))
  })

  formLogin.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault()
    const login = el<HTMLInputElement>('login-usuario').value.trim()
    const senha = campoSenha.value

    if (!login || !senha) {
      mostrarErro('login-erro', 'Informe usuário e senha.')
      return
    }

    await enviar(formLogin, 'login-erro', async () => {
      const resultado = (await window.authAPI.login({ login, senha })) as ApiResult<Sessao>
      if (!resultado.success) {
        campoSenha.value = ''
        campoSenha.focus()
      }
      return resultado
    })
  })

  formSetup.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault()
    const nome = el<HTMLInputElement>('setup-nome').value.trim()
    const login = el<HTMLInputElement>('setup-usuario').value.trim()
    const senha = el<HTMLInputElement>('setup-senha').value
    const confirmar = el<HTMLInputElement>('setup-confirmar').value

    if (senha.length < 8) {
      mostrarErro('setup-erro', 'A senha deve ter pelo menos 8 caracteres.')
      return
    }
    if (senha !== confirmar) {
      mostrarErro('setup-erro', 'As senhas não conferem.')
      return
    }

    await enviar(formSetup, 'setup-erro', async () => {
      return (await window.authAPI.criarPrimeiroAdmin({ nome, login, senha })) as ApiResult<Sessao>
    })
  })

  el('btn-tentar-novamente').addEventListener('click', () => void mostrarTelaDeAcesso())
  el('btn-sair').addEventListener('click', () => void sair())
}

export async function initAuth(aoAutenticar: (sessao: Sessao) => Promise<void>): Promise<void> {
  aoEntrar = aoAutenticar
  ligarFormularios()

  let atual: ApiResult<Sessao | null>
  try {
    atual = (await window.authAPI.sessaoAtual()) as ApiResult<Sessao | null>
  } catch {
    mostrarFalha('Não foi possível iniciar o acesso. Feche o aplicativo e abra novamente.')
    return
  }

  if (atual.success && atual.data) {
    await entrar(atual.data)
    return
  }

  await mostrarTelaDeAcesso()
}
