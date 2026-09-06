# Academia MisterFit

Aplicação desktop de controle de academia, feita com Electron, TypeScript e
PostgreSQL. Projeto Integrador individual da UC5 (Desenvolver Aplicações
Desktop).

## Funcionalidades

- Cadastro, edição e exclusão de alunos
- Desativação temporária de alunos (sem excluir o histórico)
- Cadastro e listagem de planos
- Matrícula de alunos em planos, com cálculo automático da data de término
- Listagem de alunos com plano vencido
- Filtro/busca de alunos por nome ou telefone
- Tratamento de erros com mensagens amigáveis (falha de conexão, dados
  duplicados, campos obrigatórios)
- Registro de logs de erro em arquivo, para diagnóstico pós-instalação

## Tecnologias

- Electron + Vite + TypeScript
- HTML/CSS
- PostgreSQL (via driver `pg`), hospedado na nuvem (Neon)

## Como rodar

- git clone https://github.com/amisterdan7/uc5-projeto-desktop.git
- npm install
- npm run dev


## Build e empacotamento

Este projeto usa o template `electron-vite`, que separa compilação de
empacotamento em dois comandos distintos:

```
npm run build      # Compila o projeto (typecheck + main/preload/renderer) para out/. Não gera instalador.
npm run build:win  # Roda o build acima e empacota com electron-builder, gerando o instalador .exe em release/
```

Para gerar o instalador Windows (`.exe`), sempre use `npm run build:win` —
`npm run build` sozinho só compila o código, sem empacotar.

## 🗄️ Modelagem do Banco de Dados (PostgreSQL)

A aplicação utiliza um banco de dados relacional PostgreSQL estruturado em
três tabelas principais para gerenciar alunos, planos e suas respectivas
matrículas.

### 📐 Diagrama de Relacionamento (ER)

```text
┌───────────────────┐        ┌───────────────────────┐        ┌───────────────────┐
│      ALUNOS       │        │      MATRÍCULAS       │        │       PLANOS      │
├───────────────────┤        ├───────────────────────┤        ├───────────────────┤
│ id (PK)           │◄───────┤ id_aluno (FK)         │        │ id (PK)           │
│ nome              │        │ id (PK)               │        │ nome              │
│ data_nascimento   │        │ id_plano (FK) ────────┼───────►│ preco             │
│ telefone          │        │ data_inicio           │        │ duracao_meses     │
│ ativo             │        │ data_fim_estimada     │        └───────────────────┘
└───────────────────┘        │ status                │
                             └───────────────────────┘

```
### Tabela `alunos`

| Coluna             | Tipo         | Restrições                  | Descrição                          |
|--------------------|--------------|------------------------------|-------------------------------------|
| `id`               | SERIAL       | PK                            | Identificador único                 |
| `nome`             | VARCHAR(100) | NOT NULL                      | Nome completo do aluno               |
| `data_nascimento`  | DATE         | NOT NULL                      | Data de nascimento                   |
| `telefone`         | VARCHAR(20)  | —                              | Telefone de contato (opcional)       |
| `ativo`            | BOOLEAN      | DEFAULT TRUE                  | Indica se o cadastro está ativo      |

### Tabela `planos`

| Coluna           | Tipo          | Restrições | Descrição                          |
|------------------|---------------|------------|--------------------------------------|
| `id`             | SERIAL        | PK         | Identificador único                  |
| `nome`           | VARCHAR(50)   | NOT NULL   | Nome do plano (ex: Fit, Mister)      |
| `preco`          | NUMERIC(10,2) | NOT NULL   | Valor mensal do plano                |
| `duracao_meses`  | INTEGER       | NOT NULL   | Duração do plano em meses            |

### Tabela `matriculas`

| Coluna               | Tipo         | Restrições                                      | Descrição                                   |
|----------------------|--------------|--------------------------------------------------|-----------------------------------------------|
| `id`                 | SERIAL       | PK                                                 | Identificador único                           |
| `id_aluno`           | INTEGER      | FK → `alunos.id`, NOT NULL                         | Aluno matriculado                             |
| `id_plano`           | INTEGER      | FK → `planos.id`, NOT NULL                         | Plano contratado                              |
| `data_inicio`        | DATE         | NOT NULL                                           | Data de início da matrícula                   |
| `data_fim_estimada`  | DATE         | NOT NULL                                           | Calculada a partir de `data_inicio` + duração |
| `status`             | VARCHAR(20)  | NOT NULL, DEFAULT `'ativa'`, CHECK (`ativa`/`inativa`) | Status base da matrícula                      |

> O status exibido na interface (`Ativa`, `Vencida`, `Inativa`) é calculado
> dinamicamente comparando `data_fim_estimada` com a data atual — não é uma
> coluna separada.
