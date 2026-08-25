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
