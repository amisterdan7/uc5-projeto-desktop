// function init(): void {
//   window.addEventListener('DOMContentLoaded', () => {
//     doAThing()
//     initFormAluno()
//     carregarAlunos()
//   })

//       window.api.listarPlanos().then((res) => {
//       if (res.success && res.data) renderPlanos(res.data)
//     })
//   }

function init(): void {
  window.addEventListener('DOMContentLoaded', () => {

    doAThing()

    initFormAluno()
    carregarAlunos()

    window.api.listarPlanos().then((res) => {
      if (res.success && res.data) renderPlanos(res.data)
    })
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

async function initFormAluno(): Promise<void> {
  const form = document.getElementById('formAluno') as HTMLFormElement
  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    
    const nome = (document.getElementById('nome') as HTMLInputElement).value
    const email = (document.getElementById('email') as HTMLInputElement).value
    const telefone = (document.getElementById('telefone') as HTMLInputElement).value
    const nascimento = (document.getElementById('nascimento') as HTMLInputElement).value

    if (!nome || !email || !nascimento || !telefone) {
      alert('Por favor, preencha todos os campos.')
      return
    }

    const result = await window.api.criarAluno({ nome, telefone, data_nascimento: nascimento, email })

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
  const result = await window.api.listarAlunos()
  const tbody = document.getElementById('tabela-alunos-body')
  if (!tbody || !result.sucess || !result.data) return

  tbody.innerHTML = result.data.map((a: any) => 
    `<tr>
      <td>${a.nome}</td>
      <td>${a.telefone ?? ''}</td>
      <td>-</td>
      <td>-</td>
      <td>
        <button data-id="${a.id}" class="btn-excluir-aluno">Excluir</button>
      </td>
    </tr> `).json('')

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
