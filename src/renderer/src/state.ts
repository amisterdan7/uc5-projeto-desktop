import type { Aluno, Plano, MatriculaComNomes } from './types'

export let cacheAlunos: Aluno[] = []
export let cachePlanos: Plano[] = []
export let cacheMatriculas: MatriculaComNomes[] = []

export function setCacheAlunos(dados: Aluno[]): void {
  cacheAlunos = dados
}

export function setCachePlanos(dados: Plano[]): void {
  cachePlanos = dados
}

export function setCacheMatriculas(dados: MatriculaComNomes[]): void {
  cacheMatriculas = dados
}

export let planoSelecionadoParaMatricula: number | null = null

export function setPlanoSelecionadoParaMatricula(id: number | null): void {
  planoSelecionadoParaMatricula = id
}

export function irParaView(nomeView: string): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item')
  const views = document.querySelectorAll<HTMLElement>('.view')

  navItems.forEach((nav) => nav.classList.remove('active'))
  document.querySelector<HTMLButtonElement>(`[data-view="${nomeView}"]`)?.classList.add('active')

  views.forEach((view) => {
    view.hidden = view.id !== `view-${nomeView}`
  })
}
