import type { AlunoListado, ApiResult } from './types'
import {
  cacheAlunos,
  setCacheAlunos,
  planoSelecionadoParaMatricula,
  setPlanoSelecionadoParaMatricula,
  irParaView
} from './state'
import { exibirMensagemTabela, mostrarToast } from './utils'
import { continuarParaMatricula, iniciarMatriculaParaAluno } from './matriculas'

export function iniciarContratacaoPlano(idPlano: number): void {
  setPlanoSelecionadoParaMatricula(idPlano)
  irParaView('alunos')

  const form = document.getElementById('form-aluno') as HTMLFormElement
  if (form) form.hidden = false

  const aviso = document.getElementById('aviso-plano-selecionado')
  if (aviso) {
    aviso.hidden = false
    aviso.textContent = 'Preencha seus dados para concluir a contratação do plano escolhido.'
  }

  document.getElementById('input-nome')?.focus()
}

export function initFiltroAlunos(): void {
  const inputBusca = document.getElementById('input-busca') as HTMLInputElement | null

  inputBusca?.addEventListener('input', () => {
    const termo = inputBusca.value.trim().toLowerCase()

    const alunosFiltrados = cacheAlunos.filter((aluno) => {
      const nomeMatch = aluno.nome.toLowerCase().includes(termo)
      const telMatch = aluno.telefone?.toLowerCase().includes(termo) ?? false
      return nomeMatch || telMatch
    })

    renderizarTabelaAlunos(alunosFiltrados, termo.length > 0)
  })
}

export async function carregarAlunos(): Promise<void> {
  const tbody = document.getElementById('tabela-alunos-body')
  if (!tbody) return

  try {
    const result = (await window.api.listarAlunos()) as ApiResult<AlunoListado[]>

    if (!result.success) {
      exibirMensagemTabela(
        tbody,
        `Erro do sistema: ${result.error.message ?? 'Falha ao buscar alunos.'}`,
        'erro'
      )
      return
    }

    if (!result.data) {
      exibirMensagemTabela(tbody, 'Erro do sistema: Falha ao buscar alunos.', 'erro')
      return
    }

    setCacheAlunos(result.data)

    const inputBusca = document.getElementById('input-busca') as HTMLInputElement | null
    const termo = inputBusca?.value.trim().toLowerCase() ?? ''

    if (termo) {
      const filtrados = cacheAlunos.filter((a) => a.nome.toLowerCase().includes(termo))
      renderizarTabelaAlunos(filtrados, true)
    } else {
      renderizarTabelaAlunos(cacheAlunos, false)
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado de comunicação📡'
    exibirMensagemTabela(tbody, msg, 'erro')
  }
}

function renderizarTabelaAlunos(alunos: AlunoListado[], buscaAtiva: boolean): void {
  const tbody = document.getElementById('tabela-alunos-body')
  if (!tbody) return

  tbody.replaceChildren()

  if (alunos.length === 0) {
    const msg = buscaAtiva
      ? 'Nenhum aluno encontrado para a busca informada.'
      : 'Nenhum aluno cadastrado no momento.'
    exibirMensagemTabela(tbody, msg, 'vazio')
    return
  }

  alunos.forEach((aluno) => {
    const tr = document.createElement('tr')

    // --- NOVIDADE 1: Efeito fantasma na linha ---
    if (aluno.ativo === false) {
      tr.classList.add('linha-arquivada')
    }

    const tdNome = document.createElement('td')
    tdNome.textContent = aluno.nome

    const tdTelefone = document.createElement('td')
    tdTelefone.textContent = aluno.telefone || '-'

    const tdPlano = document.createElement('td')
    tdPlano.textContent = aluno.plano_nome ?? '-'

    // --- STATUS (BADGE) ---
    const tdStatus = document.createElement('td')
    const badge = document.createElement('span')

    const classePorStatus: Record<string, string> = {
      ativa: 'badge-ativa',
      vencida: 'badge-vencida',
      inativa: 'badge-inativa',
      sem_matricula: 'badge-inativa'
    }
    const textoPorStatus: Record<string, string> = {
      ativa: 'Ativo',
      vencida: 'Vencido',
      inativa: 'Inativo',
      sem_matricula: 'Sem plano'
    }

    if (aluno.ativo === false) {
      badge.className = 'badge badge-inativa'
      badge.textContent = 'Arquivado' // Mudamos de "Desativado" para "Arquivado"
    } else {
      badge.className = `badge ${classePorStatus[aluno.status_matricula] ?? 'badge-inativa'}`
      badge.textContent = textoPorStatus[aluno.status_matricula] ?? aluno.status_matricula
    }
    tdStatus.appendChild(badge)

    // --- COLUNA DE AÇÕES ---
    const tdAcoes = document.createElement('td')
    tdAcoes.style.display = 'flex'
    tdAcoes.style.gap = '8px' // Mais espaço para respirar

    // 1. Botão Editar (Igual ao seu)
    const btnEditar = document.createElement('button')
    btnEditar.className = 'btn-icon'
    btnEditar.title = 'Editar Aluno'
    btnEditar.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`
    btnEditar.addEventListener('click', () => {
      const form = document.getElementById('form-aluno') as HTMLFormElement
      form.hidden = false

      form.dataset.editId = aluno.id.toString()
      ;(document.getElementById('input-nome') as HTMLInputElement).value = aluno.nome
      ;(document.getElementById('input-telefone') as HTMLInputElement).value = aluno.telefone ?? ''

      if (aluno.data_nascimento) {
        const dataFormatada = new Date(aluno.data_nascimento).toISOString().split('T')[0]
        ;(document.getElementById('input-nascimento') as HTMLInputElement).value = dataFormatada
      }

      const btnSubmit = form.querySelector('button[type="submit"]')
      if (btnSubmit) btnSubmit.textContent = 'Atualizar'

      const btnGerenciarPlano = document.getElementById('btn-gerenciar-plano') as HTMLButtonElement
      if (btnGerenciarPlano) {
        if (aluno.status_matricula === 'sem_matricula' || aluno.status_matricula === 'vencida') {
          btnGerenciarPlano.hidden = false
          btnGerenciarPlano.textContent =
            aluno.status_matricula === 'vencida' ? '🔄 Renovar Plano' : '➕ Adicionar Plano'
          btnGerenciarPlano.onclick = async () => {
            await iniciarMatriculaParaAluno(aluno.id)
          }
        } else {
          btnGerenciarPlano.hidden = true
        }
      }
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    const btnStatus = document.createElement('button')
    btnStatus.className = 'btn-icon'

    if (aluno.ativo === false) {
      btnStatus.title = 'Restaurar aluno'
      // Ícone de "Seta de Restaurar / Upload"
      btnStatus.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`
      btnStatus.addEventListener('click', async () => {
        if (confirm(`Deseja restaurar o cadastro de ${aluno.nome}?`)) {
          await window.api.reativarAluno(aluno.id)
          await carregarAlunos()
        }
      })
    } else {
      btnStatus.title = 'Arquivar aluno'
      // Ícone de "Caixa de Arquivo"
      btnStatus.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>`
      btnStatus.addEventListener('click', async () => {
        if (confirm(`Deseja arquivar os dados de ${aluno.nome}?`)) {
          await window.api.desativarAlunoTemporariamente(aluno.id)
          await carregarAlunos()
        }
      })
    }

    // 3. Botão Excluir Permanente
    const btnExcluir = document.createElement('button')
    btnExcluir.className = 'btn-icon danger'
    btnExcluir.title = 'Excluir Permanentemente'
    btnExcluir.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`
    btnExcluir.dataset.id = aluno.id.toString()
    btnExcluir.addEventListener('click', async () => {
      if (
        confirm(
          `ATENÇÃO: Excluir ${aluno.nome} apagará todos os registros definitivamente. Deseja continuar?`
        )
      ) {
        await window.api.excluirAluno(aluno.id)
        await carregarAlunos()
      }
    })

    tdAcoes.appendChild(btnEditar)
    tdAcoes.appendChild(btnStatus)

    if (aluno.ativo === false) {
      tdAcoes.appendChild(btnExcluir)
    }

    tr.appendChild(tdNome)
    tr.appendChild(tdTelefone)
    tr.appendChild(tdPlano)
    tr.appendChild(tdStatus)
    tr.appendChild(tdAcoes)

    tbody.appendChild(tr)
  })
}

export async function initFormAluno(): Promise<void> {
  const form = document.getElementById('form-aluno') as HTMLFormElement | null

  document.getElementById('btn-novo-aluno')?.addEventListener('click', () => {
    if (form) {
      form.hidden = false
      form.scrollIntoView({ behavior: 'smooth' })
      form.reset()
      delete form.dataset.editId

      const aviso = document.getElementById('aviso-plano-selecionado')
      if (aviso) {
        aviso.hidden = true
      }

      const btnSubmit = form.querySelector('button[type="submit"]')
      if (btnSubmit) btnSubmit.textContent = 'Salvar'

      const btnGerenciarPlano = document.getElementById('btn-gerenciar-plano') as HTMLButtonElement
      if (btnGerenciarPlano) btnGerenciarPlano.hidden = true

      document.getElementById('input-nome')?.focus()
    }
  })

  document.getElementById('btn-cancelar')?.addEventListener('click', () => {
    if (form) {
      form.reset()
      form.hidden = true
      delete form.dataset.editId
      const btnSubmit = form.querySelector('button[type="submit"]')
      if (btnSubmit) btnSubmit.textContent = 'Salvar'
    }
  })

  form?.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault()

    const nome = (document.getElementById('input-nome') as HTMLInputElement).value.trim()
    const telefone = (document.getElementById('input-telefone') as HTMLInputElement).value.trim()
    const nascimento = (
      document.getElementById('input-nascimento') as HTMLInputElement
    ).value.trim()

    const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/
    if (telefone && !telefoneRegex.test(telefone)) {
      mostrarToast('Telefone inválido. Utilize formato com DDD (ex: (84) 99999-0000).')
      return
    }

    if (!nome || !nascimento) {
      mostrarToast('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const hoje = new Date().toISOString().split('T')[0]
    if (nascimento >= hoje) {
      mostrarToast('Data de nascimento não pode ser no futuro.')
      return
    }

    const editId = form.dataset.editId

    if (editId) {
      const result = await window.api.atualizarAluno(Number(editId), {
        nome,
        telefone,
        data_nascimento: nascimento
      })

      if (!result.success || !result.data) {
        mostrarToast(`Erro ao atualizar aluno: ${result.error?.message}`)
        return
      }
      mostrarToast('Aluno atualizado com sucesso!')

      delete form.dataset.editId
      const btnSubmit = form.querySelector('button[type="submit"]')
      if (btnSubmit) btnSubmit.textContent = 'Salvar'
    } else {
      const result = await window.api.criarAluno({ nome, telefone, data_nascimento: nascimento })

      if (!result.success || !result.data) {
        mostrarToast(`Erro ao criar aluno: ${result.error?.message ?? 'Falha inesperada.'}`)
        return
      }

      if (planoSelecionadoParaMatricula !== null) {
        const idPlano = planoSelecionadoParaMatricula
        setPlanoSelecionadoParaMatricula(null)
        await continuarParaMatricula(idPlano, result.data.id)
        return
      } else {
        mostrarToast('Aluno cadastrado com sucesso!')
      }
    }
    form.reset()
    form.hidden = true
    await carregarAlunos()

    const aviso = document.getElementById('aviso-plano-selecionado')
    if (aviso) {
      aviso.hidden = true
    }
  })
}
