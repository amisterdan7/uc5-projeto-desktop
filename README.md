# Academia MisterFit

Aplicação desktop de controle de academia, feita com Electron, TypeScript e
PostgreSQL. Projeto Integrador individual da UC5 (Desenvolver Aplicações
Desktop).

## Funcionalidades

- Cadastro de alunos
- Cadastro de planos
- Matrícula de alunos em planos, com cálculo automático da data de término
- Listagem de alunos com plano vencido

## Tecnologias

- Electron + Vite + TypeScript
- HTML/CSS
- PostgreSQL (via driver `pg`)

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
npm run build      # Compila o projeto (typecheck + main/preload/renderer) para out/. Não gera instalador.
npm run build:win  # Roda o build acima e empacota com electron-builder, gerando o instalador .exe em release/
\`\`\`

Para gerar o instalador Windows (`.exe`), sempre use `npm run build:win` —
`npm run build` sozinho só compila o código, sem empacotar.

## 🗄️ Modelagem do Banco de Dados (PostgreSQL)

A aplicação utiliza um banco de dados relacional PostgreSQL estruturado em três tabelas principais para gerenciar os alunos, planos e suas respectivas matrículas.

# 📐 Diagrama de Relacionamento (ER)

\`\`\`text
  +------------------+         +----------------------+         +-------------------+
  |      ALUNOS      |         |      MATRÍCULAS      |         |      PLANOS       |
  +------------------+         +----------------------+         +-------------------+
  | id (PK)          |<-------1| id (PK)              |         | id (PK)           |
  | nome             |         | id_aluno (FK)        |         | nome              |
  | data_nascimento  |         | id_plano (FK)        |-------->| preco             |
  | telefone         |         | data_inicio          |         | duracao_meses     |
  +------------------+         | data_fim_estimada    |         +-------------------+
                               | status               |
                               +----------------------+

