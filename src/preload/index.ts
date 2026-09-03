import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  testConnection: () => ipcRenderer.invoke('db:test-connection'),

  // Alunos
  criarAluno: (aluno) => ipcRenderer.invoke('alunos:criar', aluno),
  listarAlunos: () => ipcRenderer.invoke('alunos:listar'),
  atualizarAluno: (id, aluno) => ipcRenderer.invoke('alunos:atualizar', id, aluno),
  excluirAluno: (id) => ipcRenderer.invoke('alunos:excluir', id),

  desativarAlunoTemporariamente: (id) => ipcRenderer.invoke('alunos:desativar', id),
  reativarAluno: (id) => ipcRenderer.invoke('alunos:reativar', id),

  // Planos
  criarPlano: (plano) => ipcRenderer.invoke('planos:criar', plano),
  listarPlanos: () => ipcRenderer.invoke('planos:listar'),
  atualizarPlano: (id, plano) => ipcRenderer.invoke('planos:atualizar', id, plano),
  excluirPlano: (id) => ipcRenderer.invoke('planos:excluir', id),

  // Matrículas
  criarMatricula: (matricula) => ipcRenderer.invoke('matriculas:criar', matricula),
  listarMatriculas: () => ipcRenderer.invoke('matriculas:listar'),
  atualizarStatusMatricula: (id, status) => ipcRenderer.invoke('matriculas:atualizar-status', id, status),
  excluirMatricula: (id) => ipcRenderer.invoke('matriculas:excluir', id)
})
