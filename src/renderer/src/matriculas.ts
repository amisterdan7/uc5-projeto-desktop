import type { MatriculaComNomes, ApiResult } from './types'
import { cacheAlunos, cachePlanos, setCacheMatriculas } from './state'
import { formatarDataBR, exibirMensagemTabela } from './utils'
import { irParaView } from './state'

export async function popularMatricula(): Promise<void> {
  const selectAluno = document.getElementById('select-aluno') as HTMLSelectElement | null
  const selectPlano = document.getElementById('select-plano') as HTMLSelectElement | null

  if (selectAluno) {
    selectAluno.replaceChildren()
    cacheAlunos.forEach((a) => {
      const opt = document.createElement('option')
      opt.value = a.id.toString()
      opt.textContent = a.nome
      selectAluno.appendChild(opt)
    })
  }

  if (selectPlano) {
    selectPlano.replaceChildren()
    cachePlanos.forEach((p) => {
      const opt = document.createElement('option')
      opt.value = p.id.toString()
      opt.dataset.duracao = p.duracao_meses.toString()
      opt.textContent = p.nome
      selectPlano.appendChild(opt)
    })
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
      alert('Preencha aluno, plano e data de início.')
      return
    }

    const result = await window.api.criarMatricula({
      id_aluno: idAluno,
      id_plano: idPlano,
      data_inicio: dataInicio
    })

    if (result.success) {
      alert('Matrícula criada com sucesso!')
      form.reset()
      form.hidden = true
      await carregarMatriculas()
    } else {
      alert(`Erro ao matricular: ${result.error?.message ?? 'Falha'}`)
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

  const hoje = new Date().toISOString().split('T')[0]

  matriculas.forEach((m) => {
    const tr = document.createElement('tr')

    const tdAluno = document.createElement('td')
    tdAluno.textContent = m.aluno_nome

    const tdPlano = document.createElement('td')
    tdPlano.textContent = m.plano_nome

    const tdInicio = document.createElement('td')
    tdInicio.textContent = formatarDataBR(m.data_inicio)

    const tdFim = document.createElement('td')
    tdFim.textContent = formatarDataBR(m.data_fim_estimada)

    const tdStatus = document.createElement('td')
    const vencida = m.data_fim_estimada < hoje
    const spanStatus = document.createElement('span')
    spanStatus.className = `badge ${vencida ? 'badge-vencida' : 'badge-ativa'}`
    spanStatus.textContent = vencida ? 'Vencida' : 'Ativa'
    tdStatus.appendChild(spanStatus)

    const tdAcoes = document.createElement('td')
    const btnExcluir = document.createElement('button')
    btnExcluir.className = 'btn'
    btnExcluir.textContent = 'Excluir'
    btnExcluir.addEventListener('click', async () => {
      if (confirm('Excluir esta matrícula?')) {
        await window.api.excluirMatricula(m.id)
        await carregarMatriculas()
      }
    })
    tdAcoes.appendChild(btnExcluir)

    tr.appendChild(tdAluno)
    tr.appendChild(tdPlano)
    tr.appendChild(tdInicio)
    tr.appendChild(tdFim)
    tr.appendChild(tdStatus)
    tr.appendChild(tdAcoes)

    tbody.appendChild(tr)
  })
}
