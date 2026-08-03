import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  testConnection: () => ipcRenderer.invoke('db:test-connection'),
  listarTabelas: () => ipcRenderer.invoke('db:listar-tabelas'),

  // Alunos
  criarAluno: (aluno: unknown) => ipcRenderer.invoke('alunos:criar', aluno),
  atualizarAluno: (id: number, aluno: unknown) => ipcRenderer.invoke('alunos:atualizar', id, aluno),
  excluirAluno: (id: number) => ipcRenderer.invoke('aluno:excluir', id),
  listarAlunos: () => ipcRenderer.invoke('alunos:listar'),

  // Planos
  criarPlano: (plano: unknown) => ipcRenderer.invoke('planos:criar', plano),
  atualizarPlano: (id: number, plano: unknown) => ipcRenderer.invoke('planos:atualizar', id, plano),
  excluirPlano: (id: number) => ipcRenderer.invoke('planos:excluir', id),
  listarPlanos: () => ipcRenderer.invoke('planos:listar'),

  // Matriculas
  criarMatricula: (matricula: unknown) => ipcRenderer.invoke('matriculas:criar', matricula),
  atualizarStatusMatricula: (id: number, status: 'ativa' | 'inativa') => ipcRenderer.invoke('matriculas:atualizar-status', id, status),
  excluirMatricula: (id: number) => ipcRenderer.invoke('matriculas:excluir', id),
  listarMatriculas: () => ipcRenderer.invoke('matriculas:listar')
  
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
