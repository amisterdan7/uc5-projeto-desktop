import { ElectronAPI } from '@electron-toolkit/preload'

export interface ApiError {
  message: string
  code?: string
}

type Resposta<T = void> = { success: boolean; data?: T; error?: ApiError }

// ---------- Usuários e sessão ----------
export type Perfil = 'admin' | 'recepcao'

export interface Usuario {
  id: number
  nome: string
  login: string
  perfil: Perfil
  ativo: boolean
}

export interface NovoUsuario {
  nome: string
  login: string
  senha: string
  perfil: Perfil
}

export interface Sessao {
  usuario: Usuario
  permissoes: string[]
}

// ---------- Domínio da academia ----------
export interface Aluno {
  id: number
  nome: string
  data_nascimento: string
  telefone?: string
}

export interface AlunoListado extends Aluno {
  plano_nome: string | null
  status_matricula: 'ativa' | 'inativa' | 'vencida' | 'sem_matricula'
  ativo: boolean
}

export interface Recurso {
  descricao: string
}

export interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
  descricao: string
  destaque: boolean
  recursos: Recurso[]
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

// ---------- window.api ----------
export interface Api {
  testConnection: () => Promise<Resposta<unknown>>

  // Alunos
  criarAluno: (aluno: Omit<Aluno, 'id'>) => Promise<Resposta<Aluno>>
  listarAlunos: () => Promise<Resposta<AlunoListado[]>>
  atualizarAluno: (id: number, aluno: Omit<Aluno, 'id'>) => Promise<Resposta<Aluno>>
  excluirAluno: (id: number) => Promise<Resposta>
  desativarAlunoTemporariamente: (id: number) => Promise<Resposta>
  reativarAluno: (id: number) => Promise<Resposta>

  // Planos
  criarPlano: (plano: Omit<Plano, 'id'>) => Promise<Resposta<Plano>>
  listarPlanos: () => Promise<Resposta<Plano[]>>
  atualizarPlano: (id: number, plano: Omit<Plano, 'id'>) => Promise<Resposta<Plano>>
  excluirPlano: (id: number) => Promise<Resposta>

  // Matrículas
  criarMatricula: (matricula: {
    id_aluno: number
    id_plano: number
    data_inicio: string
  }) => Promise<Resposta<Matricula>>
  listarMatriculas: () => Promise<Resposta<MatriculaComNomes[]>>
  atualizarStatusMatricula: (id: number, status: 'ativa' | 'inativa') => Promise<Resposta>
  excluirMatricula: (id: number) => Promise<Resposta>

  // Usuários (somente administrador)
  listarUsuarios: () => Promise<Resposta<Usuario[]>>
  criarUsuario: (dados: NovoUsuario) => Promise<Resposta<Usuario>>
  alterarAtivoUsuario: (id: number, ativo: boolean) => Promise<Resposta<Usuario>>
}

// ---------- window.authAPI ----------
export interface AuthApi {
  precisaConfigurar: () => Promise<Resposta<boolean>>
  criarPrimeiroAdmin: (dados: Omit<NovoUsuario, 'perfil'>) => Promise<Resposta<Sessao>>
  login: (credenciais: { login: string; senha: string }) => Promise<Resposta<Sessao>>
  logout: () => Promise<Resposta>
  sessaoAtual: () => Promise<Resposta<Sessao | null>>
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
    authAPI: AuthApi
  }
}

export {}
