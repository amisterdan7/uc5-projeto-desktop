export interface Aluno {
  id: number
  nome: string
  telefone?: string
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

export type AppError = { message: string }
export type ApiOk<T> = { success: true; data: T }
export type ApiFail = { success: false; error: AppError }
export type ApiResult<T> = ApiOk<T> | ApiFail
