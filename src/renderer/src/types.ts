export interface Aluno {
  id: number
  nome: string
  data_nascimento: string
  telefone?: string
}

export interface AlunoListado extends Aluno {
  plano_nome: string | null
  status_matricula: 'ativa' | 'inativa' | 'vencida' | 'sem_matricula'
}

export interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
}

export interface MatriculaComNomes {
  id: number
  id_aluno: number
  id_plano: number
  data_inicio: string
  data_fim_estimada: string
  status: 'ativa' | 'inativa'
  aluno_nome: string
  plano_nome: string
}

export interface Beneficio {
  texto: string
}

export interface PlanoDetalhado {
  id: number
  nome: string
  descricao: string
  precoOriginal: number
  precoPromocional: number
  duracao_meses: number
  tipo: 'mister' | 'fit' | 'basic'
  destaque: boolean
  beneficios: Beneficio[]
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

export type AppError = { message: string }
export type ApiOk<T> = { success: true; data: T }
export type ApiFail = { success: false; error: AppError }
export type ApiResult<T> = ApiOk<T> | ApiFail
