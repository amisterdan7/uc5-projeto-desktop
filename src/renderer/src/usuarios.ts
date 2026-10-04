import type { ApiResult, Perfil, Usuario } from './types'
import { sessao } from './state'
import { exibirMensagemTabela, mostrarToast } from './utils'

const ICONE_DESATIVAR = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>`
const ICONE_REATIVAR = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`

function texto(id: string): string {
  return (document.getElementById(id) as HTMLInputElement).value.trim()
}

export function initUsuarios(): void {
  const form = document.getElementById('form-usuario') as HTMLFormElement | null

  document.getElementById('btn-novo-usuario')?.addEventListener('click', () => {
    if (!form) return
    form.hidden = !form.hidden
    if (!form.hidden) document.getElementById('usuario-nome')?.focus()
  })

  document.getElementById('btn-cancelar-usuario')?.addEventListener('click', () => {
    if (!form) return
    form.reset()
    form.hidden = true
  })

  form?.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault()

    const resultado = (await window.api.criarUsuario({
      nome: texto('usuario-nome'),
      login: texto('usuario-login'),
      senha: (document.getElementById('usuario-senha') as HTMLInputElement).value,
      perfil: (document.getElementById('usuario-perfil') as HTMLSelectElement).value as Perfil
    })) as ApiResult<Usuario>

    if (!resultado.success) {
      mostrarToast(`Erro ao criar usuário: ${resultado.error.message}`, 'erro')
      return
    }

    mostrarToast('Usuário criado com sucesso!')
    form.reset()
    form.hidden = true
    await carregarUsuarios()
  })
}

export async function carregarUsuarios(): Promise<void> {
  const tbody = document.getElementById('tabela-usuarios-body')
  if (!tbody) return

  try {
    const resultado = (await window.api.listarUsuarios()) as ApiResult<Usuario[]>

    if (!resultado.success) {
      exibirMensagemTabela(tbody, `Erro ao listar usuários: ${resultado.error.message}`, 'erro')
      return
    }

    renderizarUsuarios(tbody, resultado.data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    exibirMensagemTabela(tbody, `Erro: ${msg}`, 'erro')
  }
}

function renderizarUsuarios(tbody: HTMLElement, usuarios: Usuario[]): void {
  tbody.replaceChildren()

  if (usuarios.length === 0) {
    exibirMensagemTabela(tbody, 'Nenhum usuário cadastrado.', 'vazio')
    return
  }

  usuarios.forEach((u) => {
    const tr = document.createElement('tr')
    if (!u.ativo) tr.classList.add('linha-arquivada')

    const tdNome = document.createElement('td')
    tdNome.textContent = u.nome

    const tdLogin = document.createElement('td')
    tdLogin.textContent = u.login

    const tdPerfil = document.createElement('td')
    const badgePerfil = document.createElement('span')
    badgePerfil.className = `badge ${u.perfil === 'admin' ? 'badge-admin' : 'badge-recepcao'}`
    badgePerfil.textContent = u.perfil === 'admin' ? 'Administrador' : 'Recepção'
    tdPerfil.appendChild(badgePerfil)

    const tdStatus = document.createElement('td')
    const badgeStatus = document.createElement('span')
    badgeStatus.className = `badge ${u.ativo ? 'badge-ativa' : 'badge-inativa'}`
    badgeStatus.textContent = u.ativo ? 'Ativo' : 'Desativado'
    tdStatus.appendChild(badgeStatus)

    const tdAcoes = document.createElement('td')
    tdAcoes.style.display = 'flex'
    tdAcoes.style.gap = '8px'

    if (u.id !== sessao?.usuario.id) {
      const btn = document.createElement('button')
      btn.className = 'btn-icon'
      btn.title = u.ativo ? 'Desativar usuário' : 'Reativar usuário'
      btn.innerHTML = u.ativo ? ICONE_DESATIVAR : ICONE_REATIVAR
      btn.addEventListener('click', async () => {
        const pergunta = u.ativo
          ? `Deseja desativar o acesso de ${u.nome}?`
          : `Deseja reativar o acesso de ${u.nome}?`
        if (!confirm(pergunta)) return

        const resultado = (await window.api.alterarAtivoUsuario(
          u.id,
          !u.ativo
        )) as ApiResult<Usuario>

        if (!resultado.success) {
          mostrarToast(resultado.error.message, 'erro')
          return
        }
        await carregarUsuarios()
      })
      tdAcoes.appendChild(btn)
    }

    tr.append(tdNome, tdLogin, tdPerfil, tdStatus, tdAcoes)
    tbody.appendChild(tr)
  })
}
