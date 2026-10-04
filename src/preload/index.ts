import { contextBridge, ipcRenderer } from 'electron'

// Cada função abaixo apenas repassa a chamada ao main. Quem decide se a ação é
// permitida é o main (ver main/auth/sessao.ts), nunca o renderer.
contextBridge.exposeInMainWorld('api', {
  testConnection: () => ipcRenderer.invoke('db:test-connection'),

  // Alunos
  criarAluno: (aluno: unknown) => ipcRenderer.invoke('alunos:criar', aluno),
  listarAlunos: () => ipcRenderer.invoke('alunos:listar'),
  atualizarAluno: (id: number, aluno: unknown) => ipcRenderer.invoke('alunos:atualizar', id, aluno),
  excluirAluno: (id: number) => ipcRenderer.invoke('alunos:excluir', id),
  desativarAlunoTemporariamente: (id: number) => ipcRenderer.invoke('alunos:desativar', id),
  reativarAluno: (id: number) => ipcRenderer.invoke('alunos:reativar', id),

  // Planos
  criarPlano: (plano: unknown) => ipcRenderer.invoke('planos:criar', plano),
  listarPlanos: () => ipcRenderer.invoke('planos:listar'),
  atualizarPlano: (id: number, plano: unknown) => ipcRenderer.invoke('planos:atualizar', id, plano),
  excluirPlano: (id: number) => ipcRenderer.invoke('planos:excluir', id),

  // Matrículas
  criarMatricula: (matricula: unknown) => ipcRenderer.invoke('matriculas:criar', matricula),
  listarMatriculas: () => ipcRenderer.invoke('matriculas:listar'),
  atualizarStatusMatricula: (id: number, status: string) =>
    ipcRenderer.invoke('matriculas:atualizar-status', id, status),
  excluirMatricula: (id: number) => ipcRenderer.invoke('matriculas:excluir', id),

  // Usuários (somente administrador)
  listarUsuarios: () => ipcRenderer.invoke('usuarios:listar'),
  criarUsuario: (dados: unknown) => ipcRenderer.invoke('usuarios:criar', dados),
  alterarAtivoUsuario: (id: number, ativo: boolean) =>
    ipcRenderer.invoke('usuarios:alterar-ativo', id, ativo)
})

contextBridge.exposeInMainWorld('authAPI', {
  precisaConfigurar: () => ipcRenderer.invoke('auth:precisa-setup'),
  criarPrimeiroAdmin: (dados: unknown) => ipcRenderer.invoke('auth:criar-primeiro-admin', dados),
  login: (credenciais: unknown) => ipcRenderer.invoke('auth:login', credenciais),
  logout: () => ipcRenderer.invoke('auth:logout'),
  sessaoAtual: () => ipcRenderer.invoke('auth:sessao')
})