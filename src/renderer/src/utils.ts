export function formatarDataBR(dataString: string): string {
  if (!dataString) return '-'
  const d = new Date(dataString)
  if (isNaN(d.getTime())) return dataString.split('T')[0]
  return d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export function exibirMensagemTabela(
  tbody: HTMLElement,
  texto: string,
  tipo: 'erro' | 'vazio'
): void {
  tbody.replaceChildren()
  const tr = document.createElement('tr')
  const td = document.createElement('td')
  td.colSpan = 5
  td.className = tipo === 'erro' ? 'table-msg-erro' : 'empty-state'
  td.textContent = texto
  tr.appendChild(td)
  tbody.appendChild(tr)
}

// função para pop-up
export type TipoToast = 'sucesso' | 'erro' | 'aviso'

export function mostrarToast(mensagem: string, tipo: TipoToast = 'sucesso'): void {
  const container = document.getElementById('toast-container') ?? criarContainerToast()

  const toast = document.createElement('div')
  toast.className = `toast toast-${tipo}`
  toast.textContent = mensagem

  container.appendChild(toast)

  requestAnimationFrame(() => {
    toast.classList.add('toast-visivel')
  })

  setTimeout(() => {
    toast.classList.remove('toast-visivel')
    setTimeout(() => toast.remove(), 500)
  }, 3500)
}

function criarContainerToast(): HTMLElement {
  const container = document.createElement('div')
  container.id = 'toast-container'
  document.body.appendChild(container)
  return container
}
