import { initFormAluno, initFiltroAlunos, carregarAlunos } from './alunos'
import { carregarPlanos } from './planos'
import { initToggleFormMatricula, initFormMatricula, carregarMatriculas } from './matriculas'

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

init()
