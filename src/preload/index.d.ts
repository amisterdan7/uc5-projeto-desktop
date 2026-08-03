import { ElectronAPI } from '@electron-toolkit/preload'

interface ListarTabelasResult {
  success: boolean
  data?: string[]
  error?: string
}
interface Api {
  testConnection: () => Promise<boolean>
  listarTabelas: () => Promise<ListarTabelasResult>
  criarAluno: (aluno: { nome: string; telefone?: string; data_nascimento: string; email?: string }) => Promise<{ success: boolean; data?: string; error?: string }>
  listarAlunos: () => Promise<{ sucess: boolean; data?: string; error?: string }>
  atualizarAluno: (id: number, aluno: { nome: string; telefone?: string; data_nascimento: string; email?: string }) => Promise<{ sucess: boolean; data?: string; error?: string }>
  excluirAluno: (id: number) => Promise<{ sucess: boolean; data?: string; error?: string }>
  criarPlano: (plano: { nome: string; descricao?: string; valor_mensalidade: number }) => Promise<{ sucess: boolean; data?: string; error?: string }>
  listarPlanos: () => Promise<{ sucess: boolean; data?: string[]; error?: string }>
  atualizarPlano: (id: number, plano: { nome: string; descricao?: string; valor_mensalidade: number }) => Promise<{ sucess: boolean; data?: string; error?: string }>
  excluirPlano: (id: number) => Promise<{ sucess: boolean; data?: string; error?: string }>
  criarMatricula: (matricula: { aluno_id: number; plano_id: number; data_inicio: string; data_fim?: string; status: 'ativa' | 'inativa' }) => Promise<{ sucess: boolean; data?: string; error?: string }>
  listarMatriculas: () => Promise<{ sucess: boolean; data?: string[]; error?: string }>
  atualizarStatusMatricula: (id: number, status: 'ativa' | 'inativa') => Promise<{ sucess: boolean; data?: string; error?: string }>
  excluirMatricula: (id: number) => Promise<{ sucess: boolean; data?: string; error?: string }>
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
