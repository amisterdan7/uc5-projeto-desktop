interface Recurso {
  descricao: string
  incluido: boolean
}

interface Plano {
  id: number
  nome: string
  preco: number
  precoPromocional: number
  duracaoMeses: number
  descricao: string
  destaque: boolean
  recursos: Recurso[]
}

type Aluno = { id: number; nome: string; telefone?: string }
type AppError = { message: string }
type ApiOk<T> = { success: true; data: T }
type ApiFail = { success: false; error: AppError }
type ApiResult<T> = ApiOk<T> | ApiFail

function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    initNavigation()
    doAThing()
    initFormAluno()
    carregarAlunos()
    renderPlanos([
      {
        id: 1,
        nome: 'Plano Mister',
        preco: 159.9,
        precoPromocional: 0,
        duracaoMeses: 12,
        descricao: 'Acesso completo a todas as unidades e benefícios premium.',
        destaque: true,
        recursos: [
          { descricao: 'Acesso ilimitado a todas as unidades', incluido: true },
          { descricao: 'Avaliação física mensal', incluido: true },
          { descricao: 'App MisterFit', incluido: true }
        ]
      },
      {
        id: 2,
        nome: 'Plano Fit',
        preco: 99.9,
        precoPromocional: 0,
        duracaoMeses: 6,
        descricao: 'O plano mais econômico para treinar quando quiser.',
        destaque: false,
        recursos: [
          { descricao: 'Acesso ilimitado a todas as unidades', incluido: false },
          { descricao: 'Avaliação física mensal', incluido: false },
          { descricao: 'App MisterFit', incluido: true }
        ]
      }
    ])
  })
}

function doAThing(): void {
  const versions = window.electron.process.versions
  replaceText('.electron-version', `Electron v${versions.electron}`)
  replaceText('.chrome-version', `Chromium v${versions.chrome}`)
  replaceText('.node-version', `Node v${versions.node}`)

  const ipcHandlerBtn = document.getElementById('ipcHandler')
  ipcHandlerBtn?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('ping')
  })
}

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

function badgeClass(destaque: boolean): string {
  return destaque ? 'premium' : 'basico'
}

function renderPlanos(planos: Plano[]): void {
  const grid = document.getElementById('planos-grid')
  if (!grid) return

  grid.innerHTML = planos
    .map(
      (p) =>
        `<div class="plano-card">
      <span class="plano-badge ${badgeClass(p.destaque)}">${p.nome}</span>
      <p>${p.descricao}</p>
      <p class="plano-preco"> <span>A partir de</span><br> R$ ${p.precoPromocional.toFixed(2)} <span> no 1º mês depois R$ ${p.preco.toFixed(2)}</span></p>
      <p class="plano-duracao">${p.duracaoMeses} ${p.duracaoMeses === 1 ? 'mês' : 'meses'}</p>
      <div class="plano-acoes">
        <button data-id="${p.id}" class="btn-contratar-plano">Contratar Plano</button>
      </div>

      <ul>
        ${p.recursos.map((recurso) => `<li>✅${recurso.descricao}</li>`).join('')}
      </ul>

    </div>`
    )
    .join('')
}

async function initFormAluno(): Promise<void> {
  const form = document.getElementById('form-aluno') as HTMLFormElement
  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const nome = (document.getElementById('input-nome') as HTMLInputElement).value
    const telefone = (document.getElementById('input-telefone') as HTMLInputElement).value
    const nascimento = (document.getElementById('input-nascimento') as HTMLInputElement).value

    if (!nome || !telefone || !nascimento) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }
    const telefoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/
    if (telefone && !telefoneRegex.test(telefone)) {
      alert('O telefone do aluno deve estar no formato (99) 99999-9999.')
      return
    }

    if (nome.length > 10) {
      alert('O nome do aluno não pode ter mais de 10 caracteres.')
      return
    }

    if (!nome || !nascimento || !telefone) {
      alert('Preencha todos os campos obrigatórios.')
      return
    }

    const result = await window.api.criarAluno({
      nome,
      telefone,
      data_nascimento: nascimento
    })

    if (result.success) {
      alert('Aluno criado com sucesso!')
      form.reset()
      carregarAlunos()
    } else {
      alert(`Erro ao salvar aluno: ${result.error}`)
    }
  })
}

async function carregarAlunos(): Promise<void> {
  const result = (await window.api.listarAlunos()) as ApiResult<Aluno[]>

  const tbody = document.getElementById('tabela-alunos-body')
  if (!tbody || !result.success || !result.data) return

  tbody.innerHTML = result.data
    .map(
      (a) => `
      <tr>
        <td>${a.nome}</td>
        <td>${a.telefone ?? ''}</td>
        <td>-</td>
        <td>-</td>
        <td>
          <button data-id="${a.id}" class="btn-excluir-aluno">Excluir</button>
        </td>
      </tr>`
    )
    .join('')

  tbody.querySelectorAll('.btn-excluir-aluno').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.target as HTMLElement).dataset.id)
      if (confirm('Excluir este aluno?')) {
        await window.api.excluirAluno(id)
        carregarAlunos()
      }
    })
  })
}

function replaceText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}

init()
