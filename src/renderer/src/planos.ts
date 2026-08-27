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

function badgeClasse(nome: string, destaque: boolean): string {
  if (destaque || nome.toLowerCase().includes('mister')) return 'plano-badge-mister'
  if (nome.toLowerCase().includes('fit')) return 'plano-badge-fit'
  return 'plano-badge-basic'
}

export function renderPlanos(planos: Plano[]): void {
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
    // Aplica a borda brilhante se for o plano de destaque
    card.className = `plano-card ${p.destaque ? 'card-destaque' : ''}`

    // 1. Badge do tipo de plano
    const badgeContainer = document.createElement('div')
    const badge = document.createElement('span')
    badge.className = `badge-tipo-plano ${badgeClasse(p.nome, p.destaque)}`
    badge.textContent = p.nome
    badgeContainer.appendChild(badge)

    // 2. Descrição superior
    const descricao = document.createElement('p')
    descricao.className = 'plano-descricao-topo'
    descricao.textContent = p.descricao || 'Treine com a melhor infraestrutura da região.'

    // 3. Bloco de Preço
    const infoPreco = document.createElement('div')
    infoPreco.className = 'plano-bloco-preco'

    const rotuloApartir = document.createElement('span')
    rotuloApartir.className = 'label-apartir'
    rotuloApartir.textContent = 'A partir de'

    const valorPreco = document.createElement('div')
    valorPreco.className = 'plano-preco-destaque'
    valorPreco.innerHTML = `R$ 0,00 <span class="plano-preco-pos">no 1º mês depois R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</span>`

    const duracao = document.createElement('p')
    duracao.className = 'plano-duracao-texto'
    duracao.textContent = `${p.duracao_meses} ${p.duracao_meses === 1 ? 'mês' : 'meses'}`

    infoPreco.append(rotuloApartir, valorPreco, duracao)

    const secaoRecursos = document.createElement('div')
    secaoRecursos.className = 'plano-secao-recursos'

    const tituloRecursos = document.createElement('h4')
    tituloRecursos.textContent = 'Benefícios inclusos:'
    secaoRecursos.appendChild(tituloRecursos)

    const lista = document.createElement('ul')
    lista.className = 'plano-lista-beneficios'

    if (p.recursos && p.recursos.length > 0) {
      p.recursos.forEach((r) => {
        const li = document.createElement('li')
        li.innerHTML = `
          <svg class="check-icon" width="16" height="16" fill="none" stroke="#10b981" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"></path>
          </svg>
          <span>${r.descricao}</span>
        `
        lista.appendChild(li)
      })
    }
    secaoRecursos.appendChild(lista)

    // 5. Botão de Ação
    const acoes = document.createElement('div')
    acoes.className = 'plano-acoes'

    const btn = document.createElement('button')
    btn.className = `btn w-full btn-plano`
    btn.textContent = 'Contratar Plano'
    btn.addEventListener('click', () => iniciarContratacaoPlano(p.id))

    acoes.appendChild(btn)

    // Montagem final do Card
    card.append(badgeContainer, descricao, infoPreco, secaoRecursos, acoes)
    grid.appendChild(card)
  })
}
