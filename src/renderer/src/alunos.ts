import type { Aluno, ApiResult } from './types'
import {
  cacheAlunos,
  setCacheAlunos,
  planoSelecionadoParaMatricula,
  setPlanoSelecionadoParaMatricula,
  irParaView
} from './state'
import { exibirMensagemTabela } from './utils'
import { continuarParaMatricula } from './matriculas'

export function iniciarContratacaoPlano(idPlano: number): void {
  setPlanoSelecionadoParaMatricula(idPlano)
  irParaView('alunos')

  const aviso = document.getElementById('aviso-contratacao')
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
  const tbody = document.getElementById('tbody-alunos-body')
  if (!tbody) return

  try {
    const result = (await window.api.listarAlunos()) as ApiResult<Aluno[]>

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
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado de comunicação📡'
    exibirMensagemTabela(tbody, msg, 'erro')
  }
}

function renderizarTabelaAlunos(alunos: Aluno[], buscaAtiva: boolean): void {
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

    const tdNome = document.createElement('td')
    tdNome.textContent = aluno.nome

    const tdTelefone = document.createElement('td')
    tdTelefone.textContent = aluno.telefone || '-'

    const tdPlano = document.createElement('td')
    tdPlano.textContent = '-'

    const tdStatus = document.createElement('td')
    const badge = document.createElement('span')
    badge.className = 'badge badge-ativa'
    badge.textContent = 'Ativo'
    tdStatus.appendChild(badge)

    const tdAcoes = document.createElement('td')
    const btnExcluir = document.createElement('button')
    btnExcluir.className = 'btn'
    btnExcluir.textContent = 'Excluir'
    btnExcluir.dataset.id = aluno.id.toString()
    btnExcluir.addEventListener('click', async () => {
      if (confirm(`Excluir o aluno ${aluno.nome}?`)) {
        await window.api.excluirAluno(aluno.id)
        await carregarAlunos()
      }
    })
    tdAcoes.appendChild(btnExcluir)

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
  form?.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault()

    const nome = (document.getElementById('input-nome') as HTMLInputElement).value.trim()
    const telefone = (document.getElementById('input-telefone') as HTMLInputElement).value.trim()
    const nascimento = (
      document.getElementById('input-nascimento') as HTMLInputElement
    ).value.trim()

    const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/
    if (telefone && !telefoneRegex.test(telefone)) {
      alert('Telefone inválido. Utilize formato com DDD (ex: (84) 99999-0000).')
      return
    }

    if (!nome || !nascimento) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    const result = await window.api.criarAluno({ nome, telefone, data_nascimento: nascimento })

    if (!result.success || !result.data) {
      alert(`Erro ao criar aluno: ${result.error?.message ?? 'Falha inesperada.'}`)
      return
    }

    form.reset()
    await carregarAlunos()

    const aviso = document.getElementById('aviso-plano-selecionado')
    if (aviso) {
      aviso.hidden = true
    }

    if (planoSelecionadoParaMatricula !== null) {
      const idPlano = planoSelecionadoParaMatricula
      setPlanoSelecionadoParaMatricula(null)
      await continuarParaMatricula(idPlano, result.data.id)
    } else {
      alert('Aluno cadastrado com sucesso!')
    }
  })
}
