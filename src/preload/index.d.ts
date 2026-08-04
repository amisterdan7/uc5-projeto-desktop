import { ElectronAPI } from '@electron-toolkit/preload'

interface ListarTabelasResult {
  success: boolean
  data?: string[]
  error?: string
}
interface Api {
  testConnection: () => Promise<boolean>
  criarAluno: (aluno: {
    nome: string
    telefone?: string
    data_nascimento: string
    email?: string
  }) => Promise<{ success: boolean; data?: string; error?: { message: string } }>

  listarAlunos: () => Promise<{ success: boolean; data?: string; error?: { message: string } }>

  atualizarAluno: (
    id: number,
    aluno: { nome: string; telefone?: string; data_nascimento: string; email?: string }
  ) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
  excluirAluno: (
    id: number
  ) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
  criarPlano: (plano: {
    nome: string
    descricao?: string
    valor_mensalidade: number
  }) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
  listarPlanos: () => Promise<{ success: boolean; data?: string[]; error?: { message: string } }>
  atualizarPlano: (
    id: number,
    plano: { nome: string; descricao?: string; valor_mensalidade: number }
  ) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
  excluirPlano: (
    id: number
  ) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
  criarMatricula: (matricula: {
    aluno_id: number
    plano_id: number
    data_inicio: string
    data_fim?: string
    status: 'ativa' | 'inativa'
  }) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
  listarMatriculas: () => Promise<{
    success: boolean
    data?: string[]
    error?: { message: string }
  }>
  atualizarStatusMatricula: (
    id: number,
    status: 'ativa' | 'inativa'
  ) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
  excluirMatricula: (
    id: number
  ) => Promise<{ success: boolean; data?: string; error?: { message: string } }>
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
