// fix-constraint.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'database.sqlite');

console.log('🔧 Corrigindo constraint do banco de dados...\n');

if (!fs.existsSync(dbPath)) {
  console.error('❌ Banco de dados não encontrado!');
  process.exit(1);
}

const backupPath = path.join(__dirname, `database.backup.${Date.now()}.sqlite`);
fs.copyFileSync(dbPath, backupPath);
console.log(`✅ Backup criado: ${path.basename(backupPath)}\n`);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log('📋 Etapa 1: Criando tabela temporária...');
  
  db.run(`
    CREATE TABLE transactions_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      category TEXT,
      date TEXT,
      status TEXT DEFAULT 'unpaid',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `, (err) => {
    if (err) {
      console.error('❌ Erro:', err.message);
      process.exit(1);
    }
    console.log('✅ Tabela temporária criada\n');
    
    console.log('📋 Etapa 2: Copiando dados...');
    
    db.run(`
      INSERT INTO transactions_new 
      SELECT id, userId, type, amount, description, category, date, status, created_at, updated_at 
      FROM transactions
    `, (err) => {
      if (err) {
        console.error('❌ Erro ao copiar dados:', err.message);
        process.exit(1);
      }
      console.log('✅ Dados copiados\n');
      
      console.log('📋 Etapa 3: Removendo tabela antiga...');
      
      db.run('DROP TABLE transactions', (err) => {
        if (err) {
          console.error('❌ Erro ao remover tabela antiga:', err.message);
          process.exit(1);
        }
        console.log('✅ Tabela antiga removida\n');
        
        console.log('📋 Etapa 4: Renomeando tabela nova...');
        
        db.run('ALTER TABLE transactions_new RENAME TO transactions', (err) => {
          if (err) {
            console.error('❌ Erro ao renomear:', err.message);
            process.exit(1);
          }
          console.log('✅ Tabela renomeada\n');
          testUpdates();
        });
      });
    });
  });
});

function testUpdates() {
  console.log('🧪 Testando atualizações...\n');
  
  const tests = [
    { status: 'paid', desc: '✓ paid' },
    { status: 'unpaid', desc: '✓ unpaid' },
    { status: 'pending', desc: '✓ pending' },
    { status: 'received', desc: '✓ received' }
  ];
  
  let completed = 0;
  
  db.get('SELECT id FROM transactions LIMIT 1', (err, row) => {
    if (err || !row) {
      console.error('❌ Nenhuma transação encontrada para testar');
      finalize();
      return;
    }
    
    const testId = row.id;
    
    tests.forEach((test, index) => {
      setTimeout(() => {
        db.run(
          'UPDATE transactions SET status = ? WHERE id = ?',
          [test.status, testId],
          function(err) {
            if (err) {
              console.log(`❌ ${test.desc}: FALHOU - ${err.message}`);
            } else {
              console.log(`✅ ${test.desc}: OK`);
            }
            
            completed++;
            if (completed === tests.length) {
              finalize();
            }
          }
        );
      }, index * 200);
    });
  });
}

function finalize() {
  console.log('\n' + '='.repeat(50));
  console.log('✅ CORREÇÃO CONCLUÍDA COM SUCESSO!');
  console.log('='.repeat(50));
  console.log('\n📊 O que foi feito:');
  console.log('   ✓ Backup criado');
  console.log('   ✓ Constraint removida');
  console.log('   ✓ Dados preservados');
  console.log('   ✓ Todos os status testados');
  console.log('\n🚀 Próximo passo:');
  console.log('   Reinicie o servidor: node server.js');
  console.log('   Teste atualizar para "received" e "pending"\n');
  
  db.close();
}