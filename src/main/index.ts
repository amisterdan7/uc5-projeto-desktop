import { app, shell, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { testConnection } from './db/connection'
import { criarAluno, listarAlunos, atualizarAluno, excluirAluno, desativarAlunoTemporariamente, reativarAluno } from './db/alunos_repository'
import { criarPlano, listarPlanos, atualizarPlano, excluirPlano } from './db/planos_repository'
import {
  listarMatriculas,
  criarMatricula,
  atualizarStatusMatricula,
  excluirMatricula
} from './db/matriculas_repository'
import { comTratamento, registrarErro } from './erros'
import dns from 'dns'

dns.setDefaultResultOrder('ipv4first')

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    title: 'Academia MisterFit',
    width: 1024,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    center: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      preload: join(__dirname, '../preload/index.js')
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
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
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

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.amisterdan7.academiamisterfit')

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })
  ipcMain.handle('alunos:desativar', async (_e, id) => {
    try {
      return { success: true, data: await desativarAlunoTemporariamente(id) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  ipcMain.handle('alunos:reativar', async (_e, id) => {
    try {
      return { success: true, data: await reativarAluno(id) }
    } catch (error) {
      return { success: false, error: (error as Error).message }
    }
  })

  try {
    await testConnection()
  } catch (erro) {
    console.error('Falha ao conectar no banco na inicialização:', erro)
    registrarErro('inicializacao', erro)
  }

  ipcMain.handle('db:test-connection', () =>
    comTratamento('db:test-connection', async () => await testConnection())
  )

  ipcMain.handle('alunos:criar', (_e, aluno) =>
    comTratamento('alunos:criar', async () => await criarAluno(aluno))
  )

  ipcMain.handle('alunos:listar', () =>
    comTratamento('alunos:listar', async () => await listarAlunos())
  )

  ipcMain.handle('alunos:atualizar', (_e, id, aluno) =>
    comTratamento('alunos:atualizar', async () => await atualizarAluno(id, aluno))
  )

  ipcMain.handle('alunos:excluir', (_e, id) =>
    comTratamento('alunos:excluir', async () => await excluirAluno(id))
  )

  ipcMain.handle('planos:criar', (_e, plano) =>
    comTratamento('planos:criar', async () => await criarPlano(plano))
  )

  ipcMain.handle('planos:listar', () =>
    comTratamento('planos:listar', async () => await listarPlanos())
  )

  ipcMain.handle('planos:atualizar', (_e, id, plano) =>
    comTratamento('planos:atualizar', async () => await atualizarPlano(id, plano))
  )

  ipcMain.handle('planos:excluir', (_e, id) =>
    comTratamento('planos:excluir', async () => await excluirPlano(id))
  )

  ipcMain.handle('matriculas:criar', (_e, matricula) =>
    comTratamento('matriculas:criar', async () => await criarMatricula(matricula))
  )

  ipcMain.handle('matriculas:listar', () =>
    comTratamento('matriculas:listar', async () => await listarMatriculas())
  )

  ipcMain.handle('matriculas:atualizar-status', (_e, id, status) =>
    comTratamento('matriculas:atualizar-status', async () => {
      await atualizarStatusMatricula(id, status)
    })
  )

  ipcMain.handle('matriculas:excluir', (_e, id) =>
    comTratamento('matriculas:excluir', async () => {
      await excluirMatricula(id)
    })
  )

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
