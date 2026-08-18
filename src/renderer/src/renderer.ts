let planoSelecionadoParaMatricula: number | null = null

interface Aluno {
  id: number
  nome: string
  telefone?: string
}

interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
}

interface MatriculaComNomes {
  id: number
  id_aluno: number
  id_plano: number
  data_inicio: string
  data_fim_estimada: string
  status: 'ativa' | 'inativa'
  aluno_nome: string
  plano_nome: string
}

type AppError = { message: string }
type ApiOk<T> = { success: true; data: T }
type ApiFail = { success: false; error: AppError }
type ApiResult<T> = ApiOk<T> | ApiFail

// Cache em memória para filtro no cliente sem chamadas IPC repetidas
let cacheAlunos: Aluno[] = []
let cachePlanos: Plano[] = []
let cacheMatriculas: MatriculaComNomes[] = []

function init(): void {
  window.addEventListener('DOMContentLoaded', async () => {
    initNavigation()
    initToggleFormMatricula()
    initFormMatricula()
    initFormAluno()
    initFiltroAlunos()

    await carregarPlanos()
    await carregarAlunos()
    await carregarMatriculas()
  })
}

// 1. Navegação entre telas
function initNavigation(): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item')
  const views = document.querySelectorAll<HTMLElement>('.view')

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.view

      navItems.forEach((nav) => nav.classList.remove('active'))
      item.classList.add('active')

      views.forEach((view) => {
        view.hidden = view.id !== `view-${target}`
      })
    })
  })
}

// 2. Filtro no cliente (Evento input sem IPC extra)
function initFiltroAlunos(): void {
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

// 3. Renderização e carregamento de Alunos
async function carregarAlunos(): Promise<void> {
  const tbody = document.getElementById('tabela-alunos-body')
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

    cacheAlunos = result.data

    const inputBusca = document.getElementById('input-busca') as HTMLInputElement | null
    const termo = inputBusca?.value.trim().toLowerCase() ?? ''

    if (termo) {
      const filtrados = cacheAlunos.filter((a) => a.nome.toLowerCase().includes(termo))
      renderizarTabelaAlunos(filtrados, true)
    } else {
      renderizarTabelaAlunos(cacheAlunos, false)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro inesperado de comunicação.'
    exibirMensagemTabela(tbody, `Erro crítico: ${msg}`, 'erro')
  }
}

function renderizarTabelaAlunos(alunos: Aluno[], buscaAtiva: boolean): void {
  const tbody = document.getElementById('tabela-alunos-body')
  if (!tbody) return

  tbody.replaceChildren()

  // Desfecho 2: Resposta vazia / Não encontrado
  if (alunos.length === 0) {
    const msg = buscaAtiva
      ? 'Nenhum aluno encontrado para a busca informada.'
      : 'Nenhum aluno cadastrado no momento.'
    exibirMensagemTabela(tbody, msg, 'vazio')
    return
  }

  // Desfecho 3: Dados encontrados (Construção segura com createElement e textContent)
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

async function carregarPlanos(): Promise<void> {
  const grid = document.getElementById('planos-grid')
  if (!grid) return

  try {
    const result = (await window.api.listarPlanos()) as ApiResult<Plano[]>

    if (!result.success) {
      grid.replaceChildren()
      const p = document.createElement('p')
      p.className = 'empty-state'
      p.textContent = `Erro ao carregar planos: ${result.error.message}`
      grid.appendChild(p)
      return
    }

    if (!result.data) {
      grid.replaceChildren()
      const p = document.createElement('p')
      p.className = 'empty-state'
      p.textContent = 'Nenhum plano disponível.'
      grid.appendChild(p)
      return
    }

    cachePlanos = result.data
    renderPlanos(cachePlanos)
  } catch (err: unknown) {
    console.error('Erro de conexão ao buscar planos:', err)
  }
}
 // Renderização de planos
function renderPlanos(planos: Plano[]): void {
  const grid = document.getElementById('planos-grid')
  if (!grid) return

  grid.replaceChildren()

  if (planos.length === 0) {
    const p = document.createElement('p')
    p.className = 'empty-state'
    p.textContent = 'Nenhum plano disponível.'
    grid.appendChild(p)
    return
  }

  planos.forEach((p) => {
    const card = document.createElement('div')
    card.className = 'plano-card'

    const badge = document.createElement('span')
    badge.className = 'plano-badge basico'
    badge.textContent = p.nome

    const preco = document.createElement('p')
    preco.className = 'plano-preco'
    preco.textContent = `R$ ${p.preco.toFixed(2)} `
    const precoSpan = document.createElement('span')
    precoSpan.textContent = '/mês'
    preco.appendChild(precoSpan)

    const duracao = document.createElement('p')
    duracao.className = 'plano-duracao'
    duracao.textContent = `${p.duracao_meses} ${p.duracao_meses === 1 ? 'mês' : 'meses'}`

    const acoes = document.createElement('div')
    acoes.className = 'plano-acoes'

    const btn = document.createElement('button')
    btn.className = 'btn-contratar-plano'
    btn.textContent = 'Contratar Plano'
    btn.addEventListener('click', () => {
      iniciarContratacaoPlano(p.id)
    })

    acoes.appendChild(btn)
    card.appendChild(badge)
    card.appendChild(preco)
    card.appendChild(duracao)
    card.appendChild(acoes)

    grid.appendChild(card)
  })
}

// 5. Renderização e carregamento de Matrículas
async function carregarMatriculas(): Promise<void> {
  const tbody = document.getElementById('tabela-matriculas-body')
  if (!tbody) return

  try {
    const result = (await window.api.listarMatriculas()) as ApiResult<MatriculaComNomes[]>

    if (!result.success) {
      exibirMensagemTabela(tbody, `Erro ao listar matrículas: ${result.error.message}`, 'erro')
      return
    }

    cacheMatriculas = result.data
    renderizarTabelaMatriculas(cacheMatriculas)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro desconhecido'
    exibirMensagemTabela(tbody, `Erro: ${msg}`, 'erro')
  }
}

function formatarDataBR(dataString: string): string {
  if (!dataString) return '-'
  const d = new Date(dataString)
  if (isNaN(d.getTime())) return dataString.split('T')[0]
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
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

// 6. Formulário de Alunos
async function initFormAluno(): Promise<void> {
  const form = document.getElementById('form-aluno') as HTMLFormElement | null
  form?.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault()

    const nome = (document.getElementById('input-nome') as HTMLInputElement).value.trim()
    const telefone = (document.getElementById('input-telefone') as HTMLInputElement).value.trim()
    const nascimento = (document.getElementById('input-nascimento') as HTMLInputElement).value

    const telefoneRegex = /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/
    if (telefone && !telefoneRegex.test(telefone)) {
      alert('Telefone inválido. Utilize formato com DDD (ex: (84) 99999-0000).')
      return
    }

    if (!nome || !nascimento) {
      alert('Preencha ao menos nome e data de nascimento.')
      return
    }

    const result = await window.api.criarAluno({
      nome,
      telefone,
      data_nascimento: nascimento
    })

    if (!result.success || !result.data) {
      alert(`Erro ao salvar aluno: ${result.error?.message ?? 'Falha'}`)
      return
    }

    form.reset()
    await carregarAlunos()

    const aviso = document.getElementById('aviso-plano-selecionado')
    if (aviso) aviso.hidden = true

    if (planoSelecionadoParaMatricula !== null) {
      await continuarParaMatricula(planoSelecionadoParaMatricula, result.data?.id)
      planoSelecionadoParaMatricula = null
    } else {
      alert('Aluno cadastrado com sucesso!')
    }
  })
}

// 7. Formulário e selects de Matrícula
async function popularMatricula(): Promise<void> {
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

function atualizarVencimentoCalculado(): void {
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

function initToggleFormMatricula(): void {
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

function initFormMatricula(): void {
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

// 8. Helpers e fluxo de contratação
function iniciarContratacaoPlano(idPlano: number): void {
  planoSelecionadoParaMatricula = idPlano

  const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item')
  const views = document.querySelectorAll<HTMLElement>('.view')

  navItems.forEach((nav) => nav.classList.remove('active'))
  document.querySelector<HTMLButtonElement>('[data-view="alunos"]')?.classList.add('active')

  views.forEach((view) => {
    view.hidden = view.id !== 'view-alunos'
  })

  const aviso = document.getElementById('aviso-plano-selecionado')
  if (aviso) {
    aviso.hidden = false
    aviso.textContent = 'Preencha seus dados para concluir a contratação do plano escolhido.'
  }

  document.getElementById('input-nome')?.focus()
}

async function continuarParaMatricula(idPlano: number, idAluno?: number): Promise<void> {
  const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item')
  const views = document.querySelectorAll<HTMLElement>('.view')

  navItems.forEach((nav) => nav.classList.remove('active'))
  document.querySelector<HTMLButtonElement>('[data-view="matriculas"]')?.classList.add('active')

  views.forEach((view) => {
    view.hidden = view.id !== 'view-matriculas'
  })

  await popularMatricula()

  const selectAluno = document.getElementById('select-aluno') as HTMLSelectElement
  if (idAluno) {
    selectAluno.value = idAluno.toString()
  }

  const selectPlano = document.getElementById('select-plano') as HTMLSelectElement
  selectPlano.value = idPlano.toString()

  const form = document.getElementById('form-matricula') as HTMLFormElement
  form.hidden = false

  atualizarVencimentoCalculado()
  document.getElementById('input-data-inicio')?.focus()
}

function exibirMensagemTabela(tbody: HTMLElement, texto: string, tipo: 'erro' | 'vazio'): void {
  tbody.replaceChildren()
  const tr = document.createElement('tr')
  const td = document.createElement('td')
  td.colSpan = 5
  td.className = tipo === 'erro' ? 'table-msg-erro' : 'empty-state'
  td.textContent = texto
  tr.appendChild(td)
  tbody.appendChild(tr)
}

init()
