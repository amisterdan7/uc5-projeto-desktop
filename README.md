# Academia MisterFit

Aplicação desktop de controle de academia, feita com Electron, TypeScript e
PostgreSQL. Projeto Integrador individual da UC5 (Desenvolver Aplicações
Desktop).

O acesso ao sistema é protegido por login, com dois perfis de usuário:
**administrador** e **recepcionista**.

## Funcionalidades

- Cadastro de alunos
- Cadastro de planos
- Matrícula de alunos em planos, com cálculo automático da data de término
- Inativação e reativação de matrículas
- Listagem de alunos com plano vencido

## Tecnologias

- Electron + Vite + TypeScript
- HTML/CSS
- PostgreSQL (via driver `pg`), hospedado na nuvem (Neon)

## Como rodar

\`\`\`bash
git clone https://github.com/amisterdan7/uc5-projeto-desktop.git
cd uc5-projeto-desktop
npm install
npm run dev
\`\`\`

## Build e empacotamento

Este projeto usa o template `electron-vite`, que separa compilação de
empacotamento em dois comandos distintos:

\`\`\`bash
npm run build # Compila o projeto (typecheck + main/preload/renderer) para out/. Não gera instalador.
npm run build:win # Roda o build acima e empacota com electron-builder, gerando o instalador .exe em release/
\`\`\`

Para gerar o instalador Windows (`.exe`), sempre use `npm run build:win` —
`npm run build` sozinho só compila o código, sem empacotar.

## Estrutura do projeto

```text
src/
├── main/                         # Processo principal (Electron)
│   ├── index.ts                  # Janela, menu e registro dos canais IPC
│   ├── erros.ts                  # Tratamento de erros e códigos de acesso
│   ├── auth/
│   │   ├── senha.ts              # Hash e conferência de senha (scrypt)
│   │   ├── sessao.ts             # Sessão em memória e tabela de permissões
│   │   └── ipc.ts                # Login, logout, primeiro acesso e usuários
│   └── db/                       # Acesso ao PostgreSQL (um repositório por tabela)
├── preload/
│   ├── index.ts                  # Ponte segura entre main e renderer
│   └── index.d.ts                # Tipos de window.api e window.authAPI
└── renderer/                     # Interface
    ├── index.html
    ├── assets/                   # CSS (main.css, auth.css, ...)
    └── src/                      # alunos, matriculas, planos, usuarios, auth, state...
```

## 🗄️ Modelagem do Banco de Dados (PostgreSQL)

A aplicação utiliza um banco de dados relacional PostgreSQL estruturado em três tabelas principais para gerenciar os alunos, planos e suas respectivas matrículas.

### 📐 Diagrama de Relacionamento (ER)

\`\`\`text
+------------------+ +----------------------+ +-------------------+
| ALUNOS | | MATRÍCULAS | | PLANOS |
+------------------+ +----------------------+ +-------------------+
| id (PK) |<-------1| id (PK) | | id (PK) |
| nome | | id_aluno (FK) | | nome |
| data_nascimento | | id_plano (FK) |-------->| preco |
| telefone | | data_inicio | | duracao_meses |
+------------------+ | data_fim_estimada | +-------------------+
| status |
+----------------------+

+-----------------------+
|       USUARIOS        |   Tabela independente: controla quem acessa o sistema.
+-----------------------+
| id (PK)               |
| nome                  |
| login (único)         |
| senha_hash            |
| perfil                |   'admin' ou 'recepcao'
| ativo                 |
| criado_em             |
+-----------------------+
```

A tabela `usuarios` é criada automaticamente no primeiro acesso. Ela não se
relaciona com as demais: o controle de acesso é feito pelo `perfil` do usuário
logado.