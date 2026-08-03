import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { testConnection } from './db/connection'
import { criarAluno, listarAlunos, atualizarAluno, excluirAluno } from './db/alunos_repository'
import { criarPlano, listarPlanos, atualizarPlano, excluirPlano } from './db/planos_repository'
import {
  listarMatriculas,
  criarMatricula,
  atualizarStatusMatricula,
  excluirMatricula
} from './db/matriculas_repository'
// import { error } from 'console'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    title: 'Controle de Academia',
    width: 1024,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    center: true,
    show: false,
    // autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
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
      return { sucess: true, data: await listarAlunos() }
    } catch (err) {
      return { sucess: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('alunos:atualizar', async (_e, id, aluno) => {
    try {
      return { sucess: true, data: await atualizarAluno(id, aluno) }
    } catch (error) {
      return { sucess: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('aluno:excluir', async (_e, id) => {
    try {
      return { sucess: true, data: await excluirAluno(id) }
    } catch (error) {
      return { sucess: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('planos:criar', async (_e, plano) => {
    try {
      return { sucess: true, data: await criarPlano(plano) }
    } catch (error) {
      return { sucess: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('planos:listar', async () => {
    try {
      return { sucess: true, data: await listarPlanos() }
    } catch (error) {
      return { sucess: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('planos:atualizar', async (_e, id, plano) => {
    try {
      return { sucess: true, data: await atualizarPlano(id, plano) }
    } catch (error) {
      return { sucess: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('planos:excluir', async (_e, id) => {
    try {
      return { sucess: true, data: await excluirPlano(id) }
    } catch (err) {
      return { sucess: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('matriculas:criar', async (_e, matricula) => {
    try {
      return { sucess: true, data: await criarMatricula(matricula) }
    } catch (err) {
      return { sucess: false, error: (err as Error).message }
    }
  })

  ipcMain.handle('matriculas:listar', async () => {
    try {
      return { success: true, data: await listarMatriculas() }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('matriculas:atualizar-status', async (_e, id, status) => {
    try {
      await atualizarStatusMatricula(id, status)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('matriculas:excluir', async (_e, id) => {
    try {
      await excluirMatricula(id)
      return { success: true }
    } catch (error) {
      return { success: false, error: (error as Error).message }
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
