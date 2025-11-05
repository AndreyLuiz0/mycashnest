# Sistema Financeiro - Mycashnest

Sistema financeiro completo desenvolvido em Angular com backend Node.js, baseado nas telas fornecidas.

## 🚀 Funcionalidades

- **Tela de Login**: Autenticação de usuários com opção de cadastro
- **Dashboard**: Visualização de dados financeiros com gráficos e estatísticas
- **Extrato**: Lista completa de transações com filtros e gerenciamento

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- Angular CLI
- MySQL
- npm ou yarn

## 🛠️ Instalação

### Backend

1. Navegue para a pasta backend:
```bash
cd backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure o banco de dados:
   - Crie um arquivo `.env` baseado no `env.example`
   - Configure as credenciais do MySQL
   - Execute o script SQL para criar as tabelas:
```bash
mysql -u root -p < database.sql
```

4. Inicie o servidor:
```bash
npm start
```

O backend estará rodando em `http://localhost:3000`

### Frontend

1. Navegue para a pasta frontend:
```bash
cd frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor de desenvolvimento:
```bash
ng serve
```

O frontend estará rodando em `http://localhost:4200`

## 🗄️ Estrutura do Banco de Dados

### Tabela `users`
- `id`: ID único do usuário
- `name`: Nome completo
- `email`: Email (único)
- `password`: Senha criptografada
- `created_at`: Data de criação
- `updated_at`: Data de atualização

### Tabela `transactions`
- `id`: ID único da transação
- `userId`: ID do usuário (FK)
- `type`: Tipo (income/expense)
- `amount`: Valor da transação
- `description`: Descrição
- `category`: Categoria
- `date`: Data da transação
- `status`: Status (paid/unpaid)
- `created_at`: Data de criação
- `updated_at`: Data de atualização

## 🔧 API Endpoints

### Autenticação
- `POST /api/auth/register` - Cadastro de usuário
- `POST /api/auth/login` - Login de usuário

### Transações
- `GET /api/transactions` - Listar transações do usuário
- `POST /api/transactions` - Criar nova transação
- `PUT /api/transactions/:id` - Atualizar transação
- `DELETE /api/transactions/:id` - Excluir transação
- `GET /api/transactions/dashboard` - Dados para dashboard

## 🎨 Telas Implementadas

### 1. Tela de Login
- Design baseado na imagem fornecida
- Login com email e senha
- Opção de cadastro em modal
- Integração com Google (preparado)

### 2. Dashboard
- Gráfico de pizza para categorias
- Gráfico de rosca para margem do período
- Calendário interativo
- Perfil do usuário
- Lista de últimos lançamentos
- Gráficos de tendências e barras

### 3. Extrato
- Lista completa de transações
- Filtros por tipo (Geral, Entrada, Despesas)
- Formulário para nova transação
- Edição de status
- Exclusão de transações
- Resumo financeiro

## 🔐 Autenticação

O sistema utiliza JWT (JSON Web Tokens) para autenticação:
- Tokens são armazenados no localStorage
- Interceptor automático para adicionar token nas requisições
- Guard para proteger rotas autenticadas

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- Desktop
- Tablet
- Mobile

## 🎯 Tecnologias Utilizadas

### Frontend
- Angular 20
- Angular Material
- Chart.js / ng2-charts
- SCSS
- TypeScript

### Backend
- Node.js
- Express.js
- MySQL2
- JWT
- bcryptjs
- CORS

## 🚀 Como Usar

1. Acesse `http://localhost:4200`
2. Faça login ou cadastre-se
3. Explore o dashboard com seus dados financeiros
4. Gerencie suas transações no extrato

## 📝 Dados de Teste

O sistema inclui dados de exemplo para demonstração:
- Email: `teste@email.com`
- Senha: `password`

## 🔧 Configuração de Desenvolvimento

Para desenvolvimento, certifique-se de que:
- O backend está rodando na porta 3000
- O frontend está rodando na porta 4200
- O MySQL está configurado e rodando
- As variáveis de ambiente estão configuradas

## 📄 Licença

Este projeto é para fins educacionais e de demonstração.


