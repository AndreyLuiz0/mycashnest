const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Caminho para o arquivo do banco de dados
const dbPath = path.join(__dirname, 'database.sqlite');

// Criar conexão com o banco SQLite
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Erro ao conectar ao SQLite:', err);
  } else {
    console.log('Conectado ao SQLite com sucesso!');
    // Criar tabelas se não existirem
    createTables();
  }
});

// Função para criar as tabelas
function createTables() {
  // Tabela de usuários
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela users:', err);
    } else {
      console.log('Tabela users criada/verificada com sucesso');
    }
  });

  // Tabela de transações com novos status
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT CHECK(type IN ('income', 'expense')) NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      date TEXT,
      status TEXT CHECK(status IN ('paid', 'unpaid', 'pending', 'received')) DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('Erro ao criar tabela transactions:', err);
    } else {
      console.log('Tabela transactions criada/verificada com sucesso');
      
      // Verificar se já existem dados de exemplo
      setTimeout(() => {
        db.get("SELECT COUNT(*) as count FROM users", (err, row) => {
          if (err) {
            console.error('Erro ao verificar usuários:', err);
          } else if (row.count === 0) {
            insertSampleData();
          }
        });
      }, 500);
    }
  });
}

// Função para inserir dados de exemplo
function insertSampleData() {
  // Inserir usuário de teste
  db.run(`
    INSERT INTO users (name, email, password) VALUES 
    ('Usuário Teste', 'teste@email.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
  `, function(err) {
    if (err) {
      console.error('Erro ao inserir usuário de teste:', err);
    } else {
      const userId = this.lastID;
      console.log('Usuário de teste criado com ID:', userId);
      
      // Inserir transações de exemplo com os novos status
      const transactions = [
        // Despesas
        [userId, 'expense', 179.87, 'Conta de Luz', 'Utilidades', '2025-01-06', 'paid'],
        [userId, 'expense', 100.00, 'Conta agua', 'Utilidades', '2025-02-05', 'paid'],
        [userId, 'expense', 900.00, 'Aluguel', 'Moradia', '2025-02-05', 'paid'],
        [userId, 'expense', 45.50, 'Jantar', 'Alimentação', '2025-02-06', 'unpaid'],
        [userId, 'expense', 12.30, 'Café da manhã', 'Alimentação', '2025-02-07', 'unpaid'],
        [userId, 'expense', 29.90, 'Plano stream', 'Entretenimento', '2025-02-08', 'unpaid'],
        [userId, 'expense', 89.90, 'Conta internet', 'Utilidades', '2025-02-10', 'paid'],
        [userId, 'expense', 150.00, 'Conta atrasada', 'Outros', '2025-02-12', 'unpaid'],
        [userId, 'expense', 350.00, 'Condominio', 'Moradia', '2025-02-15', 'paid'],
        [userId, 'expense', 200.00, 'Confraternização', 'Eventos', '2025-03-21', 'unpaid'],
        
        // Receitas com os novos status (received/pending)
        [userId, 'income', 3000.00, 'Salário', 'Trabalho', '2025-01-01', 'received'],
        [userId, 'income', 500.00, 'Freelance', 'Trabalho', '2025-01-15', 'received'],
        [userId, 'income', 1200.00, 'Bônus', 'Trabalho', '2025-02-20', 'pending'],
        [userId, 'income', 300.00, 'Projeto Extra', 'Trabalho', '2025-03-01', 'pending']
      ];

      const stmt = db.prepare(`
        INSERT INTO transactions (userId, type, amount, description, category, date, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      transactions.forEach(transaction => {
        stmt.run(transaction, (err) => {
          if (err) {
            console.error('Erro ao inserir transação:', err);
          }
        });
      });

      stmt.finalize((err) => {
        if (err) {
          console.error('Erro ao finalizar statement:', err);
        } else {
          console.log('Transações de exemplo inseridas com sucesso!');
        }
      });
    }
  });
}

// Função para executar queries com Promise
db.runAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

db.getAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

db.allAsync = function(sql, params = []) {
  return new Promise((resolve, reject) => {
    this.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

module.exports = db;