import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { testConnection } from './db/connection'
import { criarAluno, listarAlunos, atualizarAluno, excluirAluno } from './db/alunos_repository'
import {
  criarPlano,
  listarPlanos,
  atualizarPlano,
  excluirPlano,
  Plano
} from './db/planos_repository'
import {
  listarMatriculas,
  criarMatricula,
  atualizarStatusMatricula,
  excluirMatricula,
  Matricula
} from './db/matriculas_repository'

// Definições de tipos para os resultados da API
type AppError = { message: string }
type ApiOk<T> = { success: true; data: T }
type ApiFail = { success: false; error: AppError }
type ApiResult<T> = ApiOk<T> | ApiFail
type MatriculaComNomes = Matricula & { aluno_nome: string; plano_nome: string }

// Definindo tipos de erros
// type DbConnectionError = {
//   type: 'DB_CONNECTION'
//   message: string
// }
// type RepoError = {
//   type: 'REPOSITORY_ERROR'
//   message: string
// }
// type UpdateStatusError = {
//   type: 'UPDATE_STATUS_ERROR'
//   message: string
// }
// type NotFoundError = {
//   type: 'NOT_FOUND'
//   message: string
// }
// type AppError = DbConnectionError | UpdateStatusError | NotFoundError| RepoError

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'Acadamia MisterFit',
    width: 1024,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    center: true,
    show: false,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

function buildMenu(): void {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Arquivo',
      submenu: [{ role: 'reload' }, { type: 'separator' }, { label: 'Sair', role: 'quit' }]
    },
    {
      label: 'Editar',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' }
      ]
    },
    {
      label: 'Ajuda',
      submenu: [
        {
          label: 'Sobre o projeto',
          click: () => {
            shell.openExternal('https://github.com/amisterdan7/uc5-projeto-desktop')
          }
        }
      ]
    }
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.amisterdan7.academiamisterfit')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  ipcMain.handle('db:test-connection', async () => {
    return testConnection()
  })

  ipcMain.handle('alunos:criar', async (_e, aluno) => {
    try {
      return { success: true, data: await criarAluno(aluno) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('alunos:listar', async () => {
    try {
      return { success: true, data: await listarAlunos() }
    } catch (err) {
      return { success: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('alunos:atualizar', async (_e, id, aluno) => {
    try {
      return { success: true, data: await atualizarAluno(id, aluno) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('alunos:excluir', async (_e, id) => {
    try {
      return { success: true, data: await excluirAluno(id) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('planos:criar', async (_e, plano) => {
    try {
      return { success: true, data: await criarPlano(plano) } satisfies ApiResult<Plano>
    } catch (err) {
      return {
        success: false,
        error: { message: (err as Error).message }
      } satisfies ApiResult<Plano>
    }
  })

  ipcMain.handle('planos:listar', async () => {
    try {
      return { success: true, data: await listarPlanos() } satisfies ApiResult<Plano[]>
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return { success: false, error: { message } } satisfies ApiResult<Plano[]>
    }
  })

  ipcMain.handle('planos:atualizar', async (_e, id, plano) => {
    try {
      return { success: true, data: await atualizarPlano(id, plano) } satisfies ApiResult<Plano>
    } catch (error) {
      return {
        success: false,
        error: { message: (error as Error).message }
      } satisfies ApiResult<Plano>
    }
  })

  ipcMain.handle('planos:excluir', async (_e, id) => {
    try {
      return { success: true, data: await excluirPlano(id) } satisfies ApiResult<void>
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return { success: false, error: { message } } satisfies ApiResult<void>
    }
  })

  ipcMain.handle('matriculas:criar', async (_e, matricula) => {
    try {
      return { success: true, data: await criarMatricula(matricula) } satisfies ApiResult<Matricula>
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return { success: false, error: { message } } satisfies ApiResult<Matricula>
    }
  })

  ipcMain.handle('matriculas:listar', async () => {
    try {
      return { success: true, data: await listarMatriculas() } satisfies ApiResult<
        MatriculaComNomes[]
      >
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return { success: false, error: { message } } satisfies ApiResult<MatriculaComNomes[]>
    }
  })

  ipcMain.handle('matriculas:atualizar-status', async (_e, id, status) => {
    try {
      await atualizarStatusMatricula(id, status)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return { success: false, error: { message } } satisfies ApiResult<void>
    }
  })

  ipcMain.handle('matriculas:excluir', async (_e, id) => {
    try {
      await excluirMatricula(id)
      return { success: true }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      return { success: false, error: { message } } satisfies ApiResult<void>
    }
  })

  buildMenu()
  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  console.log('Encerrando aplicação...')
})
