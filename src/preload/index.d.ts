import { ElectronAPI } from '@electron-toolkit/preload'

interface ListarTabelasResult {
  success: boolean
  data?: string[]
  error?: string
}
interface Api {
  testConnection: () => Promise<boolean>
  listarTabelas: () => Promise<ListarTabelasResult>
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: unknown
  }
}
