# Debug de inserção de alunos

## Passo 1. `npm run dev`

```text
mister@Amisterdan MINGW64 /c/02 - Projects/uc5-projeto-desktop (conexao-banco)
$  npm run dev

> Academia MisterFit@1.0.0 dev
> electron-vite dev

vite v7.3.6 building ssr environment for development...
✓ 6 modules transformed.
out/main/index.js  8.80 kB
✓ built in 1.55s

electron main process built successfully

-----

vite v7.3.6 building ssr environment for development...
✓ 1 modules transformed.
out/preload/index.js  1.53 kB
✓ built in 109ms

electron preload scripts built


-----

dev server running for the electron renderer process at:

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose

starting electron app...


Ôùç injected env (1) from .env // tip: Ôùê secrets for agents [www.dotenvx.com]
```

## Passo 2. Abertura da aplicação e erro inicial

```text
Page Title: Academia MisterFit
URL: http://localhost:5173/
Recent events:
- [2026-08-04T10:07:09.034Z] (pageError) TypeError: Cannot read properties of undefined (reading 'process')
    at doAThing (http://localhost:5173/src/renderer.ts:40:36)
    at http://localhost:5173/src/renderer.ts:4:5
Snapshot:
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]: Academia MisterFit
    - navigation [ref=e5]:
      - button "Alunos" [ref=e6] [cursor=pointer]
      - button "Planos" [ref=e7] [cursor=pointer]
      - button "Matrículas" [ref=e8] [cursor=pointer]
  - main [ref=e9]:
    - generic [ref=e10]:
      - generic [ref=e11]:
        - heading "Alunos" [level=1] [ref=e12]
        - button "+ Novo aluno" [ref=e13] [cursor=pointer]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]: Nome
          - textbox "Nome" [ref=e17]:
            - /placeholder: Nome do aluno
        - generic [ref=e18]:
          - generic [ref=e19]: Telefone
          - textbox "Telefone" [ref=e20]:
            - /placeholder: (84) 99999-0000
        - generic [ref=e21]:
          - generic [ref=e22]: Data de nascimento
          - textbox "Data de nascimento" [ref=e23]
        - generic [ref=e24]:
          - button "Cancelar" [ref=e25] [cursor=pointer]
          - button "Salvar" [ref=e26] [cursor=pointer]
      - textbox "Buscar aluno" [ref=e28]
      - table [ref=e29]:
        - rowgroup [ref=e30]:
          - row "Nome Telefone Plano Status" [ref=e31]:
            - columnheader "Nome" [ref=e32]
            - columnheader "Telefone" [ref=e33]
            - columnheader "Plano" [ref=e34]
            - columnheader "Status" [ref=e35]
            - columnheader [ref=e36]
        - rowgroup
```

## Passo 3. Clique em "Salvar" e saída do processo Renderer/Main no intervalo

### DevTools > Console

```text
debug: [vite] connecting...
debug: [vite] connected.
debug: [vite] connecting...
debug: [vite] connected.
TypeError: Cannot read properties of undefined (reading 'process')
    at doAThing (http://localhost:5173/src/renderer.ts:40:36)
    at http://localhost:5173/src/renderer.ts:4:5
TypeError: Cannot read properties of undefined (reading 'process')
    at doAThing (http://localhost:5173/src/renderer.ts:40:36)
    at http://localhost:5173/src/renderer.ts:4:5
```

### Terminal do processo Main

```text
mister@Amisterdan MINGW64 /c/02 - Projects/uc5-projeto-desktop (conexao-banco)
$  npm run dev

> Academia MisterFit@1.0.0 dev
> electron-vite dev

vite v7.3.6 building ssr environment for development...
✓ 6 modules transformed.
out/main/index.js  8.80 kB
✓ built in 1.55s

electron main process built successfully

-----

vite v7.3.6 building ssr environment for development...
✓ 1 modules transformed.
out/preload/index.js  1.53 kB
✓ built in 109ms

electron preload scripts built successfully

-----

dev server running for the electron renderer process at:

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose

starting electron app...


Ôùç injected env (1) from .env // tip: Ôùê secrets for agents [www.dotenvx.com]
```

Nenhuma linha nova apareceu no terminal do main depois do clique em "Salvar".

## Passo 4. Script temporário isolado via `npx tsx`

### Tentativa 1

```text
mister@Amisterdan MINGW64 /c/02 - Projects/uc5-projeto-desktop (conexao-banco)
$  npx tsx --version
Need to install the following packages:
tsx@4.23.5
Ok to proceed? (y)
npm error canceled
npm error A complete log of this run can be found in: C:\Users\ricar\AppData\Local\npm-cache\_logs\2026-08-04T10_07_54_031Z-debug-0.log

mister@Amisterdan MINGW64 /c/02 - Projects/uc5-projeto-desktop (conexao-banco)
$  npx tsx --eval 'import { pool } from "./src/main/db/connection.ts"; const dbUrl = process.env.DATABASE_URL ?? ""; console.log("DATABASE_URL_PREFIX:", dbUrl.slice(0, 20)); const now = await pool.query("SELECT NOW();"); console.log("SELECT NOW():"); console.dir(now.rows, { depth: null }); const alunos = await pool.query("SELECT * FROM alunos;"); console.log("SELECT * FROM alunos:"); console.dir(alunos.rows, { depth: null }); try { const insert = await pool.query("INSERT INTO alunos (nome, data_nascimento, telefone) VALUES ($1, $2, $3) RETURNING *;", ["Teste Direto SQL", "2000-01-01", "00000000000"]); console.log("INSERT RESULT:"); console.dir(insert.rows, { depth: null }); } catch (error) { console.error("INSERT ERROR:"); console.error(error); } await pool.end();'
Need to install the following packages:
tsx@4.23.5
Ok to proceed? (y) y
node:internal/process/promises:394
    triggerUncaughtException(err, true /* fromPromise */);
    ^

Error: Transform failed with 4 errors:
/eval.ts:1:167: ERROR: Top-level await is currently not supported with the "cjs" output format
/eval.ts:1:287: ERROR: Top-level await is currently not supported with the "cjs" output format
/eval.ts:1:432: ERROR: Top-level await is currently not supported with the "cjs" output format
/eval.ts:1:738: ERROR: Top-level await is currently not supported with the "cjs" output format
    at failureErrorWithLog (C:\Users\ricar\AppData\Local\npm-cache\_npx\fd45a72a545557e9\node_modules\esbuild\lib\main.js:1748:15)
    at C:\Users\ricar\AppData\Local\npm-cache\_npx\fd45a72a545557e9\node_modules\esbuild\lib\main.js:1017:50
    at responseCallbacks.<computed> (C:\Users\ricar\AppData\Local\npm-cache\_npx\fd45a72a545557e9\node_modules\esbuild\lib\main.js:884:9)
    at handleIncomingPacket (C:\Users\ricar\AppData\Local\npm-cache\_npx\fd45a72a545557e9\node_modules\esbuild\lib\main.js:939:12)
    at Socket.readFromStdout (C:\Users\ricar\AppData\Local\npm-cache\_npx\fd45a72a545557e9\node_modules\esbuild\lib\main.js:862:7)
    at Socket.emit (node:events:509:28)
    at addChunk (node:internal/streams/readable:563:12)
    at readableChunkPushByteMode (node:internal/streams/readable:514:3)
    at Readable.push (node:internal/streams/readable:394:5)
    at Pipe.onStreamRead (node:internal/stream_base_commons:189:37) {
  errors: [
    {
      detail: undefined,
      id: '',
      location: {
        column: 167,
        file: '/eval.ts',
        length: 5,
        line: 1,
        lineText: 'import { pool } from "./src/main/db/connection.ts"; const dbUrl = process.env.DATABASE_URL ?? ""; console.log("DATABASE_URL_PREFIX:", dbUrl.slice(0, 20)); const now = await pool.query("SELECT NOW();"); console.log("SELECT NOW():"); console.dir(now.rows, { depth: null }); const alunos = await pool.query("SELECT * FROM alunos;"); console.log("SELECT * FROM alunos:"); console.dir(alunos.rows, { depth: null }); try { const insert = await pool.query("INSERT INTO alunos (nome, data_nascimento, telefone) VALUES ($1, $2, $3) RETURNING *;", ["Teste Direto SQL", "2000-01-01", "00000000000"]); console.log("INSERT RESULT:"); console.dir(insert.rows, { depth: null }); } catch (error) { console.error("INSERT ERROR:"); console.error(error); } await pool.end();',
        namespace: '',
        suggestion: ''
      },
      notes: [],
      pluginName: '',
      text: 'Top-level await is currently not supported with the "cjs" output format'
    },
    {
      detail: undefined,
      id: '',
      location: {
        column: 287,
        file: '/eval.ts',
        length: 5,
        line: 1,
        lineText: 'import { pool } from "./src/main/db/connection.ts"; const dbUrl = process.env.DATABASE_URL ?? ""; console.log("DATABASE_URL_PREFIX:", dbUrl.slice(0, 20)); const now = await pool.query("SELECT NOW();"); console.log("SELECT NOW():"); console.dir(now.rows, { depth: null }); const alunos = await pool.query("SELECT * FROM alunos;"); console.log("SELECT * FROM alunos:"); console.dir(alunos.rows, { depth: null }); try { const insert = await pool.query("INSERT INTO alunos (nome, data_nascimento, telefone) VALUES ($1, $2, $3) RETURNING *;", ["Teste Direto SQL", "2000-01-01", "00000000000"]); console.log("INSERT RESULT:"); console.dir(insert.rows, { depth: null }); } catch (error) { console.error("INSERT ERROR:"); console.error(error); } await pool.end();',
        namespace: '',
        suggestion: ''
      },
      notes: [],
      pluginName: '',
      text: 'Top-level await is currently not supported with the "cjs" output format'
    },
    {
      detail: undefined,
      id: '',
      location: {
        column: 432,
        file: '/eval.ts',
        length: 5,
        line: 1,
        lineText: 'import { pool } from "./src/main/db/connection.ts"; const dbUrl = process.env.DATABASE_URL ?? ""; console.log("DATABASE_URL_PREFIX:", dbUrl.slice(0, 20)); const now = await pool.query("SELECT NOW();"); console.log("SELECT NOW():"); console.dir(now.rows, { depth: null }); const alunos = await pool.query("SELECT * FROM alunos;"); console.log("SELECT * FROM alunos:"); console.dir(alunos.rows, { depth: null }); try { const insert = await pool.query("INSERT INTO alunos (nome, data_nascimento, telefone) VALUES ($1, $2, $3) RETURNING *;", ["Teste Direto SQL", "2000-01-01", "00000000000"]); console.log("INSERT RESULT:"); console.dir(insert.rows, { depth: null }); } catch (error) { console.error("INSERT ERROR:"); console.error(error); } await pool.end();',
        namespace: '',
        suggestion: ''
      },
      notes: [],
      pluginName: '',
      text: 'Top-level await is currently not supported with the "cjs" output format'
    },
    {
      detail: undefined,
      id: '',
      location: {
        column: 738,
        file: '/eval.ts',
        length: 5,
        line: 1,
        lineText: 'import { pool } from "./src/main/db/connection.ts"; const dbUrl = process.env.DATABASE_URL ?? ""; console.log("DATABASE_URL_PREFIX:", dbUrl.slice(0, 20)); const now = await pool.query("SELECT NOW();"); console.log("SELECT NOW():"); console.dir(now.rows, { depth: null }); const alunos = await pool.query("SELECT * FROM alunos;"); console.log("SELECT * FROM alunos:"); console.dir(alunos.rows, { depth: null }); try { const insert = await pool.query("INSERT INTO alunos (nome, data_nascimento, telefone) VALUES ($1, $2, $3) RETURNING *;", ["Teste Direto SQL", "2000-01-01", "00000000000"]); console.log("INSERT RESULT:"); console.dir(insert.rows, { depth: null }); } catch (error) { console.error("INSERT ERROR:"); console.error(error); } await pool.end();',
        namespace: '',
        suggestion: ''
      },
      notes: [],
      pluginName: '',
      text: 'Top-level await is currently not supported with the "cjs" output format'
    }
  ],
  warnings: []
}

Node.js v24.18.1
```

### Tentativa 2

```text
◇ injected env (1) from .env // tip: ⌘ suppress logs { quiet: true }
DATABASE_URL_PREFIX:
SQL TEST ERROR:
Error: The server does not support SSL connections
    at C:\02 - Projects\uc5-projeto-desktop\node_modules\pg-pool\index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async [eval]:27:15

Command exited with code 1
```

### Tentativa 3

```text
◇ injected env (1) from .env // tip: ⌘ custom filepath { path: '/custom/path/.env' }
DATABASE_URL_PREFIX:
SQL TEST ERROR:
Error: The server does not support SSL connections
    at C:\02 - Projects\uc5-projeto-desktop\node_modules\pg-pool\index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async [eval]:28:17
```

## Passo 5. Respostas objetivas

O `INSERT` direto do passo 4 não funcionou. O erro completo registrado foi:

```text
Error: The server does not support SSL connections
    at C:\02 - Projects\uc5-projeto-desktop\node_modules\pg-pool\index.js:45:11
    at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    at async [eval]:28:17
```

A variável de ambiente lida em tempo de execução foi `DATABASE_URL`, mas o prefixo impresso ficou vazio:

```text
DATABASE_URL_PREFIX:
```

Como o `INSERT` direto também falhou, não houve o cenário "INSERT direto funciona, mas o formulário não". O que foi observado é diferente: o caminho da UI quebra antes do submit por causa de `window.electron.process` indefinido em `src/renderer/src/renderer.ts`, então o handler de salvamento nem chega a ser acionado. O caminho direto, por sua vez, contorna a UI e chega ao `pool`, mas a conexão falha no nível do PostgreSQL com erro de SSL.
