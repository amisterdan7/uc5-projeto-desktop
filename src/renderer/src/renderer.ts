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

function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    initNavigation()
    doAThing()
    testarConexaoBanco()
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

async function testarConexaoBanco(): Promise<void> {
  try {
    const api = window.api as {
      testConnection: () => Promise<boolean>
      listarTabelas: () => Promise<{ success: boolean; data?: unknown; error?: unknown }>
    }

    const conectado = await api.testConnection()
    console.log('Conexão com banco:', conectado ? 'OK' : 'falhou')

    if (conectado) {
      const resultado = await api.listarTabelas()
      if (resultado.success) {
        console.log('Tabelas encontradas:', resultado.data)
      } else {
        console.error('Erro ao listar tabelas:', resultado.error)
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Erro ao testar conexão:', error.message)
    } else {
      console.error('Erro ao testar conexão (desconhecido):', error)
    }
  }
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

function replaceText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}

init()
