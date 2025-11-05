// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // usa o db.js com SQLite

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

/* ------------------------------------------
   Middleware para autenticação (JWT)
------------------------------------------ */
function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

/* ------------------------------------------
   ROTAS DE AUTENTICAÇÃO
------------------------------------------ */

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Preencha todos os campos' });

    const exists = await db.getAsync(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );
    if (exists)
      return res.status(400).json({ error: 'Email já cadastrado' });

    const hashed = await bcrypt.hash(password, 10);
    const result = await db.runAsync(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashed]
    );

    const user = { id: result.id, name, email };
    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({ user, token });
  } catch (err) {
    console.error('Erro no registro:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.getAsync(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (!user)
      return res.status(401).json({ error: 'Email ou senha incorretos' });

    const ok = await bcrypt.compare(password, user.password);
    if (!ok)
      return res.status(401).json({ error: 'Email ou senha incorretos' });

    const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (err) {
    console.error('Erro no login:', err);
    return res.status(500).json({ error: 'Erro no servidor' });
  }
});

/* ------------------------------------------
   ROTAS DE TRANSAÇÕES
------------------------------------------ */

// Buscar transações do usuário
app.get('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const rows = await db.allAsync(
      'SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC',
      [req.userId]
    );
    return res.json(rows);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Erro ao buscar transações' });
  }
});

// Criar nova transação
app.post('/api/transactions', authMiddleware, async (req, res) => {
  try {
    const { type, amount, description, category, date } = req.body;
    if (!type || !amount)
      return res.status(400).json({ error: 'Dados incompletos' });

    const result = await db.runAsync(
      'INSERT INTO transactions (userId, type, amount, description, category, date) VALUES (?, ?, ?, ?, ?, ?)',
      [req.userId, type, amount, description || null, category || null, date || null]
    );

    const newTransaction = await db.getAsync(
      'SELECT * FROM transactions WHERE id = ?',
      [result.id]
    );

    return res.status(201).json(newTransaction);
  } catch (err) {
    console.error('Erro ao criar transação:', err);
    return res.status(500).json({ error: 'Erro ao criar transação' });
  }
});

// Excluir transação
app.delete('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await db.runAsync(
      'DELETE FROM transactions WHERE id = ? AND userId = ?',
      [id, req.userId]
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('Erro ao excluir transação:', err);
    return res.status(500).json({ error: 'Erro ao excluir transação' });
  }
});

// Atualizar transação - CORRIGIDO PARA SQLITE
app.put('/api/transactions/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, description, category, date, status } = req.body;
    
    console.log('📝 Recebida solicitação de atualização:');
    console.log('   ID:', id);
    console.log('   UserId:', req.userId);
    console.log('   Dados:', { type, amount, description, category, date, status });
    
    // Validar status
    const validStatuses = ['paid', 'unpaid', 'pending', 'received'];
    if (status && !validStatuses.includes(status)) {
      console.error('❌ Status inválido:', status);
      return res.status(400).json({ 
        error: 'Status inválido',
        validStatuses: validStatuses,
        received: status
      });
    }
    
    // Verificar se a transação existe
    const existing = await db.getAsync(
      'SELECT * FROM transactions WHERE id = ? AND userId = ?',
      [id, req.userId]
    );
    
    if (!existing) {
      console.error('❌ Transação não encontrada:', { id, userId: req.userId });
      return res.status(404).json({ error: 'Transação não encontrada' });
    }
    
    console.log('✅ Transação encontrada:', existing);
    
    // Atualizar com updated_at
    const result = await db.runAsync(
      `UPDATE transactions 
       SET type = ?, 
           amount = ?, 
           description = ?, 
           category = ?, 
           date = ?, 
           status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND userId = ?`,
      [type, amount, description, category, date, status, id, req.userId]
    );
    
    console.log('✅ Linhas afetadas:', result.changes);
    
    if (result.changes === 0) {
      console.error('❌ Nenhuma linha foi atualizada');
      return res.status(500).json({ error: 'Não foi possível atualizar a transação' });
    }
    
    // Buscar transação atualizada
    const updatedTransaction = await db.getAsync(
      'SELECT * FROM transactions WHERE id = ?',
      [id]
    );
    
    console.log('✅ Transação atualizada:', updatedTransaction);
    
    return res.json(updatedTransaction);
    
  } catch (err) {
    console.error('❌ ERRO COMPLETO ao atualizar transação:');
    console.error('   Mensagem:', err.message);
    console.error('   Stack:', err.stack);
    console.error('   Código:', err.code);
    
    return res.status(500).json({ 
      error: 'Erro ao atualizar transação',
      details: err.message,
      code: err.code
    });
  }
});

// Dados do dashboard
app.get('/api/transactions/dashboard', authMiddleware, async (req, res) => {
  try {
    const recentTransactions = await db.allAsync(
      'SELECT * FROM transactions WHERE userId = ? ORDER BY date DESC LIMIT 10',
      [req.userId]
    );
    
    const incomeTotal = await db.getAsync(
      'SELECT SUM(amount) as total FROM transactions WHERE userId = ? AND type = "income"',
      [req.userId]
    );
    
    const expenseTotal = await db.getAsync(
      'SELECT SUM(amount) as total FROM transactions WHERE userId = ? AND type = "expense"',
      [req.userId]
    );
    
    const categoryStats = await db.allAsync(
      'SELECT category, SUM(amount) as total FROM transactions WHERE userId = ? GROUP BY category',
      [req.userId]
    );
    
    return res.json({
      recentTransactions: recentTransactions,
      incomeTotal: incomeTotal?.total || 0,
      expenseTotal: expenseTotal?.total || 0,
      categoryStats: categoryStats
    });
  } catch (err) {
    console.error('Erro ao buscar dados do dashboard:', err);
    return res.status(500).json({ error: 'Erro ao buscar dados do dashboard' });
  }
});

/* ------------------------------------------
   SERVIDOR
------------------------------------------ */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ API rodando na porta ${PORT}`);
});