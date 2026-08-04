# Relatório de varredura

Data da análise: 2026-08-03

Este relatório foi gerado apenas com leitura dos arquivos pedidos. Nenhum arquivo do projeto foi alterado.

## Observações gerais

- Os arquivos reais do workspace usam underscore no nome do repository: `alunos_repository.ts`, `planos_repository.ts` e `matriculas_repository.ts`.
- `npm run typecheck` concluiu sem erros reportados.
- `npm run lint` concluiu sem erros reportados no output retornado.
- Há inconsistências de contrato entre `main`, `preload` e `index.d.ts`.
- Há um canal IPC exposto no preload que não existe no main: `db:listar-tabelas`.

---

## 1) `src/main/db/connection.ts`

### Conteúdo atual completo

```ts
import { Pool } from 'pg'
import dotenv from 'dotenv'
dotenv.config()

export const pool = new Pool({})

export async function testConnection(): Promise<boolean> {
  try {
    const client = await pool.connect()
    console.log('Conectado ao postgress com sucesso')
    client.release()
    return true
  } catch (error) {
    console.log('Erro ao connectar ao Postgress:', error)
    return false
  }
}
```

### Verificação

- Não há erro de sintaxe aparente.
- Não há erro de tipo aparente.
- Não há import quebrado.
- A função exportada `testConnection` é importada corretamente em `src/main/index.ts`.

---

## 2) `src/main/db/alunos_repository.ts`

### Conteúdo atual completo

```ts
// src/main/db/alunos.repository.ts

import { pool } from './connection'

export interface Aluno {
  id: number
  nome: string
  data_nascimento: string
  telefone: string
}

export async function criarAluno(aluno: Omit<Aluno, 'id'>): Promise<Aluno> {
  const result = await pool.query(
    `INSERT INTO alunos (nome, data_nascimento, telefone)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [aluno.nome, aluno.data_nascimento, aluno.telefone]
  )
  return result.rows[0]
}

export async function listarAlunos(): Promise<Aluno[]> {
  const result = await pool.query(`SELECT * FROM alunos ORDER BY nome`)
  return result.rows
}

export async function atualizarAluno(id: number, aluno: Omit<Aluno, 'id'>): Promise<Aluno> {
  const result = await pool.query(
    `UPDATE alunos SET nome = $1, data_nascimento = $2, telefone = $3
     WHERE id = $4
     RETURNING *`,
    [aluno.nome, aluno.data_nascimento, aluno.telefone, id]
  )
  return result.rows[0]
}

export async function excluirAluno(id: number): Promise<void> {
  await pool.query(`DELETE FROM alunos WHERE id = $1`, [id])
}
```

### Verificação

- Não há erro de sintaxe aparente.
- Não há erro de tipo aparente.
- Não há import quebrado.
- As exportações `criarAluno`, `listarAlunos`, `atualizarAluno` e `excluirAluno` estão sendo importadas corretamente em `src/main/index.ts`.
- Os handlers IPC correspondentes existem em `src/main/index.ts` e os canais batem exatamente:
  - `alunos:criar`
  - `alunos:listar`
  - `alunos:atualizar`
  - `aluno:excluir`

---

## 3) `src/main/db/planos_repository.ts`

### Conteúdo atual completo

```ts
import { pool } from './connection'

export interface Plano {
  id: number
  nome: string
  preco: number
  duracao_meses: number
}

export async function criarPlano(plano: Omit<Plano, 'id'>): Promise<Plano> {
  const result = await pool.query(
    'INSERT INTO planos (nome, preco, duracao_meses) VALUES ($1, $2, $3) RETURNING *'[
      (plano.nome, plano.preco, plano.duracao_meses)
    ]
  )
  return result.rows[0]
}

export async function listarPlanos(): Promise<Plano[]> {
  const result = await pool.query(`SELECT * FROM planos ORDER BY preco`)
  return result.rows
}

export async function atualizarPlano(id: number, plano: Omit<Plano, 'id'>): Promise<Plano> {
  const result = await pool.query(
    'UPDATE planos SET nome = $1, preco = $2, duracao_meses = $3 WHERE id = $4 RETURNING *'[
      (plano.nome, plano.preco, plano.duracao_meses, id)
    ]
  )
  return result.rows[0]
}
export async function excluirPlano(id: number): Promise<void> {
  await pool.query('DELETE FROM planos WHERE id = $1', [id])
}
```

### Verificação

- Não apareceu erro de TypeScript no `typecheck`, mas o código tem problema evidente de runtime.
- As chamadas `criarPlano` e `atualizarPlano` estão escritas de forma inválida para SQL/`pg`.
- Não há import quebrado.
- As exportações estão sendo importadas corretamente em `src/main/index.ts`.
- Os handlers IPC correspondentes existem em `src/main/index.ts` e os canais batem exatamente:
  - `planos:criar`
  - `planos:listar`
  - `planos:atualizar`
  - `planos:excluir`

---

## 4) `src/main/db/matriculas_repository.ts`

### Conteúdo atual completo

```ts
import { pool } from './connection'

export interface Matricula {
  id: number
  id_aluno: number
  id_plano: number
  data_inicio: string
  data_fim: string
  // valor_pago: number;
  status: 'ativa' | 'inativa'
}

export async function criarMatricula(
  matricula: Omit<Matricula, 'id' | 'ativa' | 'data_fim_estimada'>
): Promise<Matricula> {
  const planoResult = await pool.query(`SELECT duracao_meses FROM planos WHERE id = $1`, [
    matricula.id_plano
  ])

  const duracaoMeses = planoResult.rows[0]?.duracao_meses ?? 1

  const result = await pool.query(
    `INSERT INTO matricula (id_aluno, id_plano, data_inicio, data_inicio_estimada, status) 
        VALUES ($1, $2, $3, $::date + ($4 || ' months')::interval, 'ativa') RETURNING *
        `,
    [matricula.id_aluno, matricula.id_plano, matricula.data_inicio, duracaoMeses]
  )
  return result.rows[0]
}

export async function listarMatriculas(): Promise<
  (Matricula & { aluno_nome: string; plano_nome: string })[]
> {
  const result = await pool.query(`
    SELECT m.*, a.nome AS aluno_nome, p.nome AS plano_nome
    FROM matriculas m
    JOIN alunos a ON a.id = m.id_aluno
    JOIN planos p ON p.id = m.id_plano
    ORDER BY m.data_inicio DESC
  `)
  return result.rows
}

export async function atualizarStatusMatricula(
  id: number,
  status: 'ativa' | 'inativa'
): Promise<void> {
  await pool.query(`UPDATE matriculas SET status = $1 WHERE id = $2 `, [status, id])
}

export async function excluirMatricula(id: number): Promise<void> {
  await pool.query('DELETE  FROM matriculas WHERE id = $1', [id])
}
```

### Verificação

- Não apareceu erro de TypeScript no `typecheck`, mas há problemas evidentes de runtime/SQL.
- O `INSERT` usa `matricula` no singular e a query contém `data_inicio_estimada` e `$::date`, o que parece inconsistente/inválido.
- Não há import quebrado.
- As exportações estão sendo importadas corretamente em `src/main/index.ts`.
- Os handlers IPC correspondentes existem em `src/main/index.ts` e os canais batem exatamente:
  - `matriculas:criar`
  - `matriculas:listar`
  - `matriculas:atualizar-status`
  - `matriculas:excluir`

---

## 5) `src/main/index.ts`

### Conteúdo atual completo

```ts
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

  ipcMain.handle('aluno:excluir', async (_e, id) => {
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
```

### Verificação

- Os imports dos repositories estão corretos e correspondem às exportações existentes.
- Todos os handlers IPC que correspondem aos repositories existem.
- Não há erro de sintaxe aparente.
- Não há erro de tipo aparente no `typecheck`.
- Problema encontrado: `src/preload/index.ts` expõe `listarTabelas`, mas este arquivo não registra `db:listar-tabelas`.

### Canais IPC encontrados no main

- `db:test-connection`
- `alunos:criar`
- `alunos:listar`
- `alunos:atualizar`
- `aluno:excluir`
- `planos:criar`
- `planos:listar`
- `planos:atualizar`
- `planos:excluir`
- `matriculas:criar`
- `matriculas:listar`
- `matriculas:atualizar-status`
- `matriculas:excluir`

---

## 6) `src/preload/index.ts`

### Conteúdo atual completo

```ts
import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  testConnection: () => ipcRenderer.invoke('db:test-connection'),
  listarTabelas: () => ipcRenderer.invoke('db:listar-tabelas'),

  // Alunos
  criarAluno: (aluno: unknown) => ipcRenderer.invoke('alunos:criar', aluno),
  atualizarAluno: (id: number, aluno: unknown) => ipcRenderer.invoke('alunos:atualizar', id, aluno),
  excluirAluno: (id: number) => ipcRenderer.invoke('aluno:excluir', id),
  listarAlunos: () => ipcRenderer.invoke('alunos:listar'),

  // Planos
  criarPlano: (plano: unknown) => ipcRenderer.invoke('planos:criar', plano),
  atualizarPlano: (id: number, plano: unknown) => ipcRenderer.invoke('planos:atualizar', id, plano),
  excluirPlano: (id: number) => ipcRenderer.invoke('planos:excluir', id),
  listarPlanos: () => ipcRenderer.invoke('planos:listar'),

  // Matriculas
  criarMatricula: (matricula: unknown) => ipcRenderer.invoke('matriculas:criar', matricula),
  atualizarStatusMatricula: (id: number, status: 'ativa' | 'inativa') =>
    ipcRenderer.invoke('matriculas:atualizar-status', id, status),
  excluirMatricula: (id: number) => ipcRenderer.invoke('matriculas:excluir', id),
  listarMatriculas: () => ipcRenderer.invoke('matriculas:listar')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
```

### Verificação

- Não há erro de sintaxe aparente.
- Os nomes das funções expostas batem com os usos atuais do renderer para alunos.
- Problema encontrado: `listarTabelas` chama `db:listar-tabelas`, mas o main não tem handler correspondente.

### Funções expostas em `api`

- `testConnection`
- `listarTabelas`
- `criarAluno`
- `atualizarAluno`
- `excluirAluno`
- `listarAlunos`
- `criarPlano`
- `atualizarPlano`
- `excluirPlano`
- `listarPlanos`
- `criarMatricula`
- `atualizarStatusMatricula`
- `excluirMatricula`
- `listarMatriculas`

---

## 7) `src/preload/index.d.ts`

### Conteúdo atual completo

```ts
import { ElectronAPI } from '@electron-toolkit/preload'

interface ListarTabelasResult {
  success: boolean
  data?: string[]
  error?: string
}
interface Api {
  testConnection: () => Promise<boolean>
  listarTabelas: () => Promise<ListarTabelasResult>
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
```

### Verificação

- A tipagem não corresponde ao runtime real do preload/main em vários pontos.
- `listarTabelas` está tipado, mas não existe handler no main.
- As assinaturas de retorno estão desalinhadas com os dados reais retornados pelos handlers.
- Há divergência de nomes de campos entre as tipagens e os repositories reais, especialmente em planos e matrículas.
- O `typecheck` não acusou esses desalinhamentos, então o problema é de contrato funcional, não de compilação.

---

## 8) `src/renderer/src/renderer.ts`

### Conteúdo atual completo

```ts
interface Recurso {
  descricao: string
  incluido: boolean
}

interface Plano {
  id: number
  nome: string
  preco: number
  precoPromocional: number
  duracaoMeses: number
  descricao: string
  destaque: boolean
  recursos: Recurso[]
}

type Aluno = { id: number; nome: string; telefone?: string }
type AppError = { message: string }
type ApiOk<T> = { success: true; data: T }
type ApiFail = { success: false; error: AppError }
type ApiResult<T> = ApiOk<T> | ApiFail

function init(): void {
  window.addEventListener('DOMContentLoaded', () => {
    initNavigation()
    doAThing()
    initFormAluno()
    carregarAlunos()
    renderPlanos([
      {
        id: 1,
        nome: 'Plano Mister',
        preco: 159.9,
        precoPromocional: 0,
        duracaoMeses: 12,
        descricao: 'Acesso completo a todas as unidades e benefícios premium.',
        destaque: true,
        recursos: [
          { descricao: 'Acesso ilimitado a todas as unidades', incluido: true },
          { descricao: 'Avaliação física mensal', incluido: true },
          { descricao: 'App MisterFit', incluido: true }
        ]
      },
      {
        id: 2,
        nome: 'Plano Fit',
        preco: 99.9,
        precoPromocional: 0,
        duracaoMeses: 6,
        descricao: 'O plano mais econômico para treinar quando quiser.',
        destaque: false,
        recursos: [
          { descricao: 'Acesso ilimitado a todas as unidades', incluido: false },
          { descricao: 'Avaliação física mensal', incluido: false },
          { descricao: 'App MisterFit', incluido: true }
        ]
      }
    ])
  })
}

function doAThing(): void {
  const versions = window.electron.process.versions
  replaceText('.electron-version', `Electron v${versions.electron}`)
  replaceText('.chrome-version', `Chromium v${versions.chrome}`)
  replaceText('.node-version', `Node v${versions.node}`)

  const ipcHandlerBtn = document.getElementById('ipcHandler')
  ipcHandlerBtn?.addEventListener('click', () => {
    window.electron.ipcRenderer.send('ping')
  })
}

function initNavigation(): void {
  const navItems = document.querySelectorAll<HTMLButtonElement>('.nav-item')
  const views = document.querySelectorAll<HTMLElement>('.view')

  navItems.forEach((item) => {
    item.addEventListener('click', () => {
      const target = item.dataset.view

      navItems.forEach((nav) => nav.classList.remove('active'))
      item.classList.add('active')

      views.forEach((view) => {
        view.hidden = view.id !== `view-${target}`
      })
    })
  })
}

function badgeClass(destaque: boolean): string {
  return destaque ? 'premium' : 'basico'
}

function renderPlanos(planos: Plano[]): void {
  const grid = document.getElementById('planos-grid')
  if (!grid) return

  grid.innerHTML = planos
    .map(
      (p) =>
        `<div class="plano-card">
      <span class="plano-badge ${badgeClass(p.destaque)}">${p.nome}</span>
      <p>${p.descricao}</p>
      <p class="plano-preco"> <span>A partir de</span><br> R$ ${p.precoPromocional.toFixed(2)} <span> no 1º mês depois R$ ${p.preco.toFixed(2)}</span></p>
      <p class="plano-duracao">${p.duracaoMeses} ${p.duracaoMeses === 1 ? 'mês' : 'meses'}</p>
      <div class="plano-acoes">
        <button data-id="${p.id}" class="btn-contratar-plano">Contratar Plano</button>
      </div>

      <ul>
        ${p.recursos.map((recurso) => `<li>✅${recurso.descricao}</li>`).join('')}
      </ul>

    </div>`
    )
    .join('')
}
async function initFormAluno(): Promise<void> {
  const form = document.getElementById('formAluno') as HTMLFormElement
  form.addEventListener('submit', async (event) => {
    event.preventDefault()

    const nome = (document.getElementById('nome') as HTMLInputElement).value
    const email = (document.getElementById('email') as HTMLInputElement).value
    const telefone = (document.getElementById('telefone') as HTMLInputElement).value
    const nascimento = (document.getElementById('nascimento') as HTMLInputElement).value

    if (!nome || !email || !nascimento || !telefone) {
      alert('Por favor, preencha todos os campos.')
      return
    }

    const result = await window.api.criarAluno({
      nome,
      telefone,
      data_nascimento: nascimento,
      email
    })

    if (result.success) {
      alert('Aluno criado com sucesso!')
      form.reset()
      carregarAlunos()
    } else {
      alert(`Erro ao salvar aluno: ${result.error}`)
    }
  })
}

async function carregarAlunos(): Promise<void> {
  const result = (await window.api.listarAlunos()) as ApiResult<Aluno[]>

  const tbody = document.getElementById('tabela-alunos-body')
  if (!tbody || !result.success || !result.data) return

  tbody.innerHTML = result.data
    .map(
      (a) => `
      <tr>
        <td>${a.nome}</td>
        <td>${a.telefone ?? ''}</td>
        <td>-</td>
        <td>-</td>
        <td>
          <button data-id="${a.id}" class="btn-excluir-aluno">Excluir</button>
        </td>
      </tr>`
    )
    .join('')

  tbody.querySelectorAll('.btn-excluir-aluno').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const id = Number((e.target as HTMLElement).dataset.id)
      if (confirm('Excluir este aluno?')) {
        await window.api.excluirAluno(id)
        carregarAlunos()
      }
    })
  })
}

function replaceText(selector: string, text: string): void {
  const element = document.querySelector<HTMLElement>(selector)
  if (element) {
    element.innerText = text
  }
}

init()
```

### Verificação

- As chamadas a `window.api` usam exatamente os nomes expostos no preload para o que este arquivo realmente consome:
  - `criarAluno`
  - `listarAlunos`
  - `excluirAluno`
- Não há divergência de nome entre renderer e preload para essas chamadas.
- O renderer não usa `listarTabelas`, então o canal ausente não afeta este arquivo diretamente.
- Não houve erro de sintaxe reportado pelo `typecheck`.

---

## Resultado dos comandos executados

### `npm run typecheck`

```text
> Academia MisterFit@1.0.0 typecheck:node
> tsc --noEmit -p tsconfig.node.json --composite false


> Academia MisterFit@1.0.0 typecheck:web
> tsc --noEmit -p tsconfig.web.json --composite false
```

### `npm run lint`

```text
> Academia MisterFit@1.0.0 lint
> eslint --cache .
```

---

## Conclusão final

- Os arquivos estão coerentes em relação a imports e handlers principais de alunos, planos e matrículas.
- Existe um desalinhamento funcional importante em `listarTabelas`.
- `src/preload/index.d.ts` não representa o contrato real do preload/runtime.
- `planos_repository.ts` e `matriculas_repository.ts` têm trechos de SQL que merecem revisão manual, mesmo sem erro de compilação.
