# Academia MisterFit

Aplicação desktop de controle de academia, feita com Electron, TypeScript e
PostgreSQL. Projeto Integrador individual da UC5 (Desenvolver Aplicações
Desktop).

O acesso ao sistema é protegido por login, com dois perfis de usuário:
**administrador** e **recepcionista**.

## Funcionalidades

- Login obrigatório: ninguém usa o sistema sem se identificar
- Perfis de acesso (administrador e recepcionista), com permissões diferentes
- Gestão de usuários (somente administrador)
- Cadastro de alunos, com busca por nome ou telefone
- Arquivamento e restauração de alunos
- Cadastro de planos
- Vitrine de planos, com contratação direta (plano, cadastro do aluno e matrícula)
- Matrícula de alunos em planos, com cálculo automático da data de término
- Inativação e reativação de matrículas
- Listagem de alunos com plano vencido

## Autenticação e perfis de acesso

### Primeiro acesso

Na primeira vez que o sistema abre com o banco vazio, a tela de acesso pede a
criação do **administrador inicial**. A tabela `usuarios` é criada
automaticamente. Depois disso, é o administrador quem cadastra os demais
usuários, na tela **Usuários**.

### Permissões

| Ação                                              | Administrador | Recepcionista |
| ------------------------------------------------- | :-----------: | :-----------: |
| Ver planos, alunos e matrículas                   |      ✅       |      ✅       |
| Cadastrar alunos                                  |      ✅       |      ✅       |
| Criar matrículas                                  |      ✅       |      ✅       |
| Editar dados do aluno                             |      ✅       |      ✅       |
| Arquivar e restaurar alunos                       |      ✅       |      ❌       |
| Excluir alunos definitivamente                    |      ✅       |      ❌       |
| Inativar e reativar matrículas                    |      ✅       |      ❌       |
| Excluir matrículas                                |      ✅       |      ❌       |
| Criar, editar e excluir planos                    |      ✅       |      ❌       |
| Cadastrar, ativar e desativar usuários            |      ✅       |      ❌       |

Resumindo: o administrador tem acesso a tudo, inclusive excluir. O
recepcionista consulta, cadastra e edita, mas não exclui, não arquiva e não
inativa registros.

A tabela de permissões fica em um único lugar, o objeto `PERMISSOES` em
`src/main/auth/sessao.ts`. Para liberar ou bloquear uma ação para a recepção,
basta alterar essa lista.

### Como a segurança funciona

- **As permissões são validadas no processo principal (main).** A interface
  apenas esconde os botões que o perfil não pode usar. Mesmo que alguém chame a
  API pelo console, o main recusa a ação.
- **Senhas nunca são guardadas em texto.** Usamos `scrypt` (módulo `crypto` do
  Node) com salt individual por usuário.
- **Bloqueio contra tentativas em sequência:** 5 senhas erradas para o mesmo
  usuário bloqueiam o login dele por 60 segundos.
- **A sessão fica só na memória do main.** O renderer não recebe senha nem
  token. Recarregar a janela não desloga, e fechar o aplicativo encerra a sessão.
- **Mensagem única para erro de login:** "Usuário ou senha incorretos", sem
  revelar se o usuário existe.
- **Console do navegador (DevTools) disponível apenas em desenvolvimento.**
- Um administrador não consegue desativar o próprio usuário.

## Tecnologias

- Electron + Vite + TypeScript
- HTML/CSS
- PostgreSQL (via driver `pg`)

## Como rodar

```bash
git clone https://github.com/amisterdan7/uc5-projeto-desktop.git
cd uc5-projeto-desktop
npm install
npm run dev
```

Ao abrir pela primeira vez, crie o administrador na tela de acesso.

## Build e empacotamento

Este projeto usa o template `electron-vite`, que separa compilação de
empacotamento em dois comandos distintos:

```bash
npm run build # Compila o projeto (typecheck + main/preload/renderer) para out/. Não gera instalador.
npm run build:win # Roda o build acima e empacota com electron-builder, gerando o instalador .exe em release/
```

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

A aplicação utiliza um banco de dados relacional PostgreSQL estruturado em
quatro tabelas principais: alunos, planos, matrículas e usuários do sistema.

### 📐 Diagrama de Relacionamento (ER)

```text
+------------------+       +----------------------+       +-------------------+
|      ALUNOS      |       |      MATRÍCULAS      |       |       PLANOS      |
+------------------+       +----------------------+       +-------------------+
| id (PK)          |<-----1| id (PK)              |       | id (PK)           |
| nome             |       | id_aluno (FK)        |       | nome              |
| data_nascimento  |       | id_plano (FK)        |------>| preco             |
| telefone         |       | data_inicio          |       | duracao_meses     |
+------------------+       | data_fim_estimada    |       +-------------------+
                           | status               |
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