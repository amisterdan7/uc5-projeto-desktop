import type { MatriculaComNomes, ApiResult, Plano, AlunoListado } from './types'
import { setCacheMatriculas, setCacheAlunos, setCachePlanos } from './state'
import { formatarDataBR, exibirMensagemTabela } from './utils'
import { irParaView } from './state'
import { mostrarToast } from './utils'

export async function popularMatricula(): Promise<void> {
  const selectAluno = document.getElementById('select-aluno') as HTMLSelectElement | null
  const selectPlano = document.getElementById('select-plano') as HTMLSelectElement | null

  // 1. Popula Alunos buscando direto do Main (Banco de Dados)
  if (selectAluno) {
    selectAluno.replaceChildren()

    const optionVazia = document.createElement('option')
    optionVazia.value = ''
    optionVazia.textContent = 'Selecione um aluno...'
    optionVazia.disabled = true
    optionVazia.selected = true
    selectAluno.appendChild(optionVazia)

    try {
      const result = (await window.api.listarAlunos()) as ApiResult<AlunoListado[]>
      if (result.success && result.data) {
        setCacheAlunos(result.data) // Atualiza o estado global
        result.data.forEach((a) => {
          const opt = document.createElement('option')
          opt.value = a.id.toString()
          opt.textContent = a.nome
          selectAluno.appendChild(opt)
        })
      }
    } catch (error) {
      console.error('Erro ao buscar alunos:', error)
    }
  }

  // 2. Popula Planos buscando direto do Main (Banco de Dados)
  if (selectPlano) {
    selectPlano.replaceChildren()

    const optionVazia = document.createElement('option')
    optionVazia.value = ''
    optionVazia.textContent = 'Selecione um plano...'
    optionVazia.disabled = true
    optionVazia.selected = true
    selectPlano.appendChild(optionVazia)

    try {
      const result = (await window.api.listarPlanos()) as ApiResult<Plano[]>
      if (result.success && result.data) {
        setCachePlanos(result.data) // Atualiza o estado global
        result.data.forEach((p) => {
          const opt = document.createElement('option')
          opt.value = p.id.toString()
          opt.dataset.duracao = p.duracao_meses.toString()
          opt.textContent = p.nome
          selectPlano.appendChild(opt)
        })
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error)
    }
  }

  atualizarVencimentoCalculado()
}

export function atualizarVencimentoCalculado(): void {
  const selectPlano = document.getElementById('select-plano') as HTMLSelectElement | null
  const inputInicio = document.getElementById('input-data-inicio') as HTMLInputElement | null
  const inputFim = document.getElementById('input-data-fim') as HTMLInputElement | null

  if (!selectPlano || !inputInicio || !inputFim) return

  const opcaoSelecionada = selectPlano.selectedOptions[0]
  const duracao = Number(opcaoSelecionada?.dataset.duracao ?? 0)

  if (!inputInicio.value || !duracao) {
    inputFim.value = ''
    return
  }

  const dataInicio = new Date(inputInicio.value)
  dataInicio.setMonth(dataInicio.getMonth() + duracao)
  inputFim.value = dataInicio.toISOString().split('T')[0]

  const spanVencimento = document.getElementById('span-vencimento-calculado')
  if (spanVencimento) {
    spanVencimento.textContent = formatarDataBR(inputFim.value)
  }
}

export function initToggleFormMatricula(): void {
  const form = document.getElementById('form-matricula') as HTMLFormElement | null
  const novaMatricula = document.getElementById('btn-nova-matricula')
  const cancelar = document.getElementById('btn-cancelar-matricula')

  novaMatricula?.addEventListener('click', async () => {
    await popularMatricula()
    if (form) form.hidden = !form.hidden
  })

  cancelar?.addEventListener('click', () => {
    if (form) {
      form.reset()
      form.hidden = true
    }
  })

  document.getElementById('select-plano')?.addEventListener('change', atualizarVencimentoCalculado)
  document
    .getElementById('input-data-inicio')
    ?.addEventListener('change', atualizarVencimentoCalculado)
}

export function initFormMatricula(): void {
  const form = document.getElementById('form-matricula') as HTMLFormElement | null
  form?.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault()

    const idAluno = Number((document.getElementById('select-aluno') as HTMLSelectElement).value)
    const idPlano = Number((document.getElementById('select-plano') as HTMLSelectElement).value)
    const dataInicio = (document.getElementById('input-data-inicio') as HTMLInputElement).value

    if (!idAluno || !idPlano || !dataInicio) {
      mostrarToast('Preencha aluno, plano e data de início.')
      return
    }

    const result = await window.api.criarMatricula({
      id_aluno: idAluno,
      id_plano: idPlano,
      data_inicio: dataInicio
    })

    if (result.success) {
      mostrarToast('Matrícula criada com sucesso!')
      form.reset()
      form.hidden = true
      await carregarMatriculas()
    } else {
      mostrarToast(`Erro ao matricular: ${result.error?.message ?? 'Falha'}`)
    }
  })
}

export async function continuarParaMatricula(idPlano: number, idAluno?: number): Promise<void> {
  irParaView('matriculas')
  await popularMatricula()

  const selectAluno = document.getElementById('select-aluno') as HTMLSelectElement
  if (idAluno) selectAluno.value = idAluno.toString()

  const selectPlano = document.getElementById('select-plano') as HTMLSelectElement
  selectPlano.value = idPlano.toString()

  const form = document.getElementById('form-matricula') as HTMLFormElement
  form.hidden = false

  atualizarVencimentoCalculado()
  document.getElementById('input-data-inicio')?.focus()
}

export async function carregarMatriculas(): Promise<void> {
  const tbody = document.getElementById('tabela-matriculas-body')
  if (!tbody) return

  try {
    const result = (await window.api.listarMatriculas()) as ApiResult<MatriculaComNomes[]>

    if (!result.success) {
      exibirMensagemTabela(tbody, `Erro ao listar matrículas: ${result.error.message}`, 'erro')
      return
    }

    setCacheMatriculas(result.data)
    renderizarTabelaMatriculas(result.data)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    exibirMensagemTabela(tbody, `Erro: ${msg}`, 'erro')
  }
}

function renderizarTabelaMatriculas(matriculas: MatriculaComNomes[]): void {
  const tbody = document.getElementById('tabela-matriculas-body')
  if (!tbody) return

  tbody.replaceChildren()

  if (matriculas.length === 0) {
    exibirMensagemTabela(tbody, 'Nenhuma matrícula registrada.', 'vazio')
    return
  }

  matriculas.forEach((m) => {
    const tr = document.createElement('tr')

    // --- Efeito visual de linha apagada (Arquivada) ---
    if (m.status === 'inativa') {
      tr.classList.add('linha-arquivada')
    }

    const tdAluno = document.createElement('td')
    tdAluno.textContent = m.aluno_nome

    const tdPlano = document.createElement('td')
    tdPlano.textContent = m.plano_nome

    const tdInicio = document.createElement('td')
    tdInicio.textContent = formatarDataBR(m.data_inicio)

    const tdFim = document.createElement('td')
    tdFim.textContent = formatarDataBR(m.data_fim_estimada)

    // --- STATUS (BADGE) ---
    const tdStatus = document.createElement('td')
    const badge = document.createElement('span')

    const classPorStatus: Record<string, string> = {
      ativa: 'badge-ativa',
      inativa: 'badge-inativa',
      vencida: 'badge-vencida'
    }
    const textoPorStatus: Record<string, string> = {
      ativa: 'Ativa',
      inativa: 'Inativa',
      vencida: 'Vencida'
    }

    badge.className = `badge ${classPorStatus[m.status] ?? 'badge-inativa'}`
    badge.textContent = textoPorStatus[m.status] ?? m.status
    tdStatus.appendChild(badge)

    // --- COLUNA DE AÇÕES ---
    const tdAcoes = document.createElement('td')
    tdAcoes.style.display = 'flex'
    tdAcoes.style.gap = '8px'

    const btnStatus = document.createElement('button')
    btnStatus.className = 'btn-icon'

    if (m.status === 'inativa') {
      btnStatus.title = 'Reativar matrícula'
      btnStatus.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>`
      btnStatus.addEventListener('click', async () => {
        if (confirm(`Deseja reativar a matrícula de ${m.aluno_nome}?`)) {
          await window.api.atualizarStatusMatricula(m.id, 'ativa')
          await carregarMatriculas()
        }
      })
    } else {
      btnStatus.title = 'Inativar/Cancelar matrícula'
      btnStatus.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>`
      btnStatus.addEventListener('click', async () => {
        if (confirm(`Deseja inativar a matrícula de ${m.aluno_nome}?`)) {
          await window.api.atualizarStatusMatricula(m.id, 'inativa')
          await carregarMatriculas()
        }
      })
    }

    const btnExcluir = document.createElement('button')
    btnExcluir.className = 'btn-icon danger'
    btnExcluir.title = 'Excluir Permanentemente'
    btnExcluir.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`
    btnExcluir.addEventListener('click', async () => {
      if (
        window.confirm(
          'ATENÇÃO: Excluir esta matrícula apagará o registro definitivamente. Deseja continuar?'
        )
      ) {
        await window.api.excluirMatricula(m.id)
        await carregarMatriculas()
      }
    })

    tdAcoes.appendChild(btnStatus)
    if (m.status === 'inativa') {
      tdAcoes.appendChild(btnExcluir)
    }

    tr.appendChild(tdAluno)
    tr.appendChild(tdPlano)
    tr.appendChild(tdInicio)
    tr.appendChild(tdFim)
    tr.appendChild(tdStatus)
    tr.appendChild(tdAcoes)

    tbody.appendChild(tr)
  })
}

export async function iniciarMatriculaParaAluno(idAluno: number): Promise<void> {
  irParaView('matriculas')
  await popularMatricula()

  const selectAluno = document.getElementById('select-aluno') as HTMLSelectElement
  selectAluno.value = idAluno.toString()

  const form = document.getElementById('form-matricula') as HTMLFormElement
  form.hidden = false

  atualizarVencimentoCalculado()
  document.getElementById('select-plano')?.focus()
}
