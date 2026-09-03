import { ElectronAPI } from '@electron-toolkit/preload'

export interface ApiError {
  message: string
}

interface Recurso {
  descricao: string
}

interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
  descricao: string
  destaque: boolean
  recursos: Recurso[]
}

export interface Aluno {
  id: number
  nome: string
  data_nascimento: string
  telefone?: string
}

export interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
}

export interface Matricula {
  id: number
  id_aluno: number
  id_plano: number
  data_inicio: string
  data_fim_estimada: string
  status: 'ativa' | 'inativa'
}

export interface MatriculaComNomes extends Matricula {
  aluno_nome: string
  plano_nome: string
}

interface AlunoListado extends Aluno {
  plano_nome: string | null
  status_matricula: 'ativa' | 'inativa' | 'vencida' | 'sem_matricula'
}

export interface Api {
  reativarAluno: any
  showWarning(mensagem: string): unknown
  showError(mensagem: string): unknown
  testConnection: () => Promise<boolean>

  // Alunos
  criarAluno: (
    aluno: Omit<Aluno, 'id'>
  ) => Promise<{ success: boolean; data?: Aluno; error?: ApiError }>
  listarAlunos: () => Promise<{ success: boolean; data?: AlunoListado[]; error?: ApiError }>
  atualizarAluno: (
    id: number,
    aluno: Omit<Aluno, 'id'>
  ) => Promise<{ success: boolean; data?: Aluno; error?: ApiError }>
  excluirAluno: (id: number) => Promise<{ success: boolean; error?: ApiError }>

  // Planos
  criarPlano: (
    plano: Omit<Plano, 'id'>
  ) => Promise<{ success: boolean; data?: Plano; error?: ApiError }>
  listarPlanos: () => Promise<{ success: boolean; data?: Plano[]; error?: ApiError }>
  atualizarPlano: (
    id: number,
    plano: Omit<Plano, 'id'>
  ) => Promise<{ success: boolean; data?: Plano; error?: ApiError }>
  excluirPlano: (id: number) => Promise<{ success: boolean; error?: ApiError }>

  desativarAlunoTemporariamente: (id: number) => Promise<{ success: boolean; error?: ApiError }>

  // Matrículas
  criarMatricula: (matricula: {
    id_aluno: number
    id_plano: number
    data_inicio: string
  }) => Promise<{ success: boolean; data?: Matricula; error?: ApiError }>
  listarMatriculas: () => Promise<{
    success: boolean
    data?: MatriculaComNomes[]
    error?: ApiError
  }>
  atualizarStatusMatricula: (
    id: number,
    status: 'ativa' | 'inativa'
  ) => Promise<{ success: boolean; error?: ApiError }>
  excluirMatricula: (id: number) => Promise<{ success: boolean; error?: ApiError }>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}

export {}
