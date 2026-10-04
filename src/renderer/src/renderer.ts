import { initFormAluno, initFiltroAlunos, carregarAlunos } from './alunos'
import { carregarPlanos } from './planos'
import { initToggleFormMatricula, initFormMatricula, carregarMatriculas } from './matriculas'
import { initUsuarios, carregarUsuarios } from './usuarios'
import { initAuth } from './auth'
import { podeFazer } from './state'

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

  const itemPadrao =
    document.querySelector<HTMLButtonElement>('.nav-item[data-view="planos"]') || navItems[0]

  itemPadrao?.click()
}

function init(): void {
  window.addEventListener('DOMContentLoaded', async () => {
    initNavigation()
    initToggleFormMatricula()
    initFormMatricula()
    initFormAluno()
    initFiltroAlunos()
    initUsuarios()

    // Nada de dados é carregado antes do login: o main recusaria mesmo.
    await initAuth(async () => {
      await carregarPlanos()
      await carregarAlunos()
      await carregarMatriculas()
      if (podeFazer('usuarios:listar')) await carregarUsuarios()
    })
  })
}

init()
