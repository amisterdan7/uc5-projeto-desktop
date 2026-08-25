import type { Plano, ApiResult } from './types'
import { setCachePlanos } from './state'
import { iniciarContratacaoPlano } from './alunos'

export async function carregarPlanos(): Promise<void> {
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

    setCachePlanos(result.data)
    renderPlanos(result.data)
  } catch (err: unknown) {
    console.error('Erro de conexão ao buscar planos:', err)
  }
}

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
