import type { AlunoListado, ApiResult } from './types'
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

  // Mostra o formulário de cadastro de aluno quando o usuário clica em "Contratar Plano"
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
  } catch (err: unknown) {
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

    const tdNome = document.createElement('td')
    tdNome.textContent = aluno.nome

    const tdTelefone = document.createElement('td')
    tdTelefone.textContent = aluno.telefone || '-'

    const tdPlano = document.createElement('td')
    tdPlano.textContent = aluno.plano_nome ?? '-'

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
    tdStatus.appendChild(badge)

    badge.className = `badge ${classePorStatus[aluno.status_matricula] ?? 'badge-inativa'}`
    badge.textContent = textoPorStatus[aluno.status_matricula] ?? aluno.status_matricula
    tdStatus.appendChild(badge)

    const btnEditar = document.createElement('button')
    btnEditar.className = 'btn-icon'

    btnEditar.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>`
    btnEditar.addEventListener('click', () => {
      const form = document.getElementById('form-aluno') as HTMLFormElement
      form.hidden = false

      // 1. Guarda o ID do aluno no formulário para usarmos no submit
      form.dataset.editId = aluno.id.toString()

      // 2. Preenche os campos
      ;(document.getElementById('input-nome') as HTMLInputElement).value = aluno.nome
      ;(document.getElementById('input-telefone') as HTMLInputElement).value = aluno.telefone ?? ''

      // A data que vem do banco precisa ser formatada para YYYY-MM-DD para o input type="date"
      if (aluno.data_nascimento) {
        const dataFormatada = new Date(aluno.data_nascimento).toISOString().split('T')[0]
        ;(document.getElementById('input-nascimento') as HTMLInputElement).value = dataFormatada
      }

      // Muda o texto do botão de Salvar para Atualizar
      const btnSubmit = form.querySelector('button[type="submit"]')
      if (btnSubmit) btnSubmit.textContent = 'Atualizar'

      window.scrollTo({ top: 0, behavior: 'smooth' })
    })

    const tdAcoes = document.createElement('td')
    const btnExcluir = document.createElement('button')
    btnExcluir.className = 'btn-icon danger'
    btnExcluir.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>`
    btnExcluir.dataset.id = aluno.id.toString()
    btnExcluir.addEventListener('click', async () => {
      if (confirm(`Excluir o aluno ${aluno.nome}?`)) {
        await window.api.excluirAluno(aluno.id)
        await carregarAlunos()
      }
    })
    tdAcoes.appendChild(btnEditar)
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

    // Validação do telefone (opcional), Aperfeiçoar para aceitar o tamanho correto e o formato com DDD
    const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/
    if (telefone && !telefoneRegex.test(telefone)) {
      alert('Telefone inválido. Utilize formato com DDD (ex: (84) 99999-0000).')
      return
    }

    if (!nome || !nascimento) {
      alert('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    // Verifica se estamos editando um aluno existente ou criando um novo
    const editId = form.dataset.editId

    if (editId) {
      const result = await window.api.atualizarAluno(Number(editId), {
        nome,
        telefone,
        data_nascimento: nascimento
      })

      if (!result.success || !result.data) {
        alert(`Erro ao atualizar aluno: ${result.error?.message}`)
        return
      }
      alert('Aluno atualizado com sucesso!')

      delete form.dataset.editId
      const btnSubmit = form.querySelector('button[type="submit"]')
      if (btnSubmit) btnSubmit.textContent = 'Salvar'
    } else {
      const result = await window.api.criarAluno({ nome, telefone, data_nascimento: nascimento })

      if (!result.success || !result.data) {
        alert(`Erro ao criar aluno: ${result.error?.message ?? 'Falha inesperada.'}`)
        return
      }

      if (planoSelecionadoParaMatricula !== null) {
        const idPlano = planoSelecionadoParaMatricula
        setPlanoSelecionadoParaMatricula(null)
        await continuarParaMatricula(idPlano, result.data.id)
        return
      } else {
        alert('Aluno cadastrado com sucesso!')
      }
    }
    form.reset()
    await carregarAlunos()

    const aviso = document.getElementById('aviso-plano-selecionado')
    if (aviso) {
      aviso.hidden = true
    }
  })
}
