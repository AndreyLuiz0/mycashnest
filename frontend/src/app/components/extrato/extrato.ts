import { Component, OnInit, LOCALE_ID, ChangeDetectorRef } from '@angular/core';
import { CommonModule, registerLocaleData } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import localePt from '@angular/common/locales/pt';

import { TransactionService, Transaction } from '../../services/transaction.service';

// Registra a localidade portuguesa
registerLocaleData(localePt);

@Component({
  selector: 'app-extrato',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './extrato.html',
  styleUrls: ['./extrato.scss'],
  providers: [
    { provide: LOCALE_ID, useValue: 'pt-BR' }
  ]
})
export class ExtratoComponent implements OnInit {

  transactions: (Transaction & { selected?: boolean })[] = [];
  filteredTransactions: (Transaction & { selected?: boolean })[] = [];

  activeFilter: 'all' | 'income' | 'expense' = 'all';
  showNewTransaction = false;
  isLoading = false;

  newTransaction = {
    date: new Date().toISOString().split('T')[0],
    description: '',
    amount: 0,
    status: 'unpaid' as 'paid' | 'unpaid' | 'pending' | 'received',
    type: 'expense' as 'income' | 'expense'
  };

  paidTotal = 0;
  unpaidTotal = 0;
  totalAmount = 0;

  constructor(
    private transactionService: TransactionService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {
    console.log('ExtratoComponent construtor chamado');
  }

  ngOnInit(): void {
    console.log('ngOnInit chamado');
    this.loadTransactions();
  }

  loadTransactions(): void {
    console.log('loadTransactions iniciado');
    this.isLoading = true;
    
    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        console.log('Transações recebidas:', transactions);
        this.transactions = transactions.map(t => ({ ...t, selected: false }));
        this.applyFilter();
        this.isLoading = false;
        
        // Força a detecção de mudanças
        this.cdr.detectChanges();
        console.log('Transações carregadas e filtradas:', this.filteredTransactions.length);
      },
      error: (error) => {
        console.error('Erro ao carregar transações:', error);
        this.showError('Erro ao carregar transações');
        this.isLoading = false;
        
        // Inicializa arrays vazios em caso de erro
        this.transactions = [];
        this.filteredTransactions = [];
        this.calculateTotals();
        
        // Força a detecção de mudanças
        this.cdr.detectChanges();
      }
    });
  }

  setFilter(filter: 'all' | 'income' | 'expense'): void {
    console.log('Filtro alterado para:', filter);
    this.activeFilter = filter;
    this.applyFilter();
  }

  applyFilter(): void {
    console.log('applyFilter chamado, activeFilter:', this.activeFilter);
    console.log('Total de transações:', this.transactions.length);
    
    switch (this.activeFilter) {
      case 'income':
        this.filteredTransactions = this.transactions.filter(t => t.type === 'income');
        break;
      case 'expense':
        this.filteredTransactions = this.transactions.filter(t => t.type === 'expense');
        break;
      default:
        this.filteredTransactions = [...this.transactions];
    }

    console.log('Transações filtradas:', this.filteredTransactions.length);
    this.calculateTotals();
  }

  private calculateTotals(): void {
    // Para despesas: paid = pago, unpaid/pending = não pago
    // Para receitas: received = recebido, pending = a receber
    this.paidTotal = this.filteredTransactions
      .filter(t => {
        const status = t.status as string;
        return (t.type === 'expense' && status === 'paid') || 
               (t.type === 'income' && status === 'received');
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    this.unpaidTotal = this.filteredTransactions
      .filter(t => {
        const status = t.status as string;
        return (t.type === 'expense' && (status === 'unpaid' || status === 'pending')) || 
               (t.type === 'income' && status === 'pending');
      })
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    this.totalAmount = this.filteredTransactions
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    console.log('Totais calculados - Pago/Recebido:', this.paidTotal, 'Não pago/A receber:', this.unpaidTotal, 'Total:', this.totalAmount);
  }

  showNewTransactionForm(): void {
    this.showNewTransaction = true;
    this.newTransaction = {
      date: new Date().toISOString().split('T')[0],
      description: '',
      amount: 0,
      status: 'unpaid',
      type: 'expense'
    };
  }

  cancelNewTransaction(): void {
    this.showNewTransaction = false;
  }

  saveTransaction(): void {
    if (this.isLoading) return;

    if (!this.newTransaction.description || !this.newTransaction.amount) {
      this.showError('Por favor, preencha todos os campos');
      return;
    }

    this.isLoading = true;

    const transactionData = {
      type: this.newTransaction.type,
      amount: this.newTransaction.amount,
      description: this.newTransaction.description,
      date: this.newTransaction.date,
      status: this.newTransaction.status
    };

    this.transactionService.createTransaction(transactionData).subscribe({
      next: (newTransaction) => {
        console.log('Nova transação criada:', newTransaction);
        this.transactions = [{ ...newTransaction, selected: false }, ...this.transactions];
        this.applyFilter();
        this.showNewTransaction = false;
        this.showSuccess('Transação criada com sucesso!');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao criar transação:', error);
        this.showError('Erro ao criar transação');
        this.isLoading = false;
      }
    });
  }

  updateTransactionStatus(transaction: Transaction): void {
    // Guarda o status anterior para reverter em caso de erro
    const previousStatus = transaction.status;
    
    console.log('=== ATUALIZANDO STATUS ===');
    console.log('ID da transação:', transaction.id);
    console.log('Tipo:', transaction.type);
    console.log('Status anterior:', previousStatus);
    console.log('Novo status:', transaction.status);
    
    this.transactionService.updateTransactionStatus(transaction.id, transaction).subscribe({
      next: (updatedTransaction) => {
        console.log('✅ Status atualizado com sucesso!');
        console.log('Resposta do servidor:', updatedTransaction);
        
        // Atualiza a transação local com os dados retornados
        const index = this.transactions.findIndex(t => t.id === transaction.id);
        if (index !== -1) {
          this.transactions[index] = { 
            ...this.transactions[index],
            ...updatedTransaction, 
            selected: this.transactions[index].selected 
          };
        }
        
        this.applyFilter();
        
        // Mensagem de sucesso contextual
        let statusMessage = '';
        if (transaction.type === 'expense') {
          statusMessage = transaction.status === 'paid' ? 'Pago' : 'Não Pago';
        } else {
          statusMessage = transaction.status === 'received' ? 'Recebido' : 'A Receber';
        }
        
        this.showSuccess(`Status alterado para ${statusMessage}`);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('❌ ERRO ao atualizar status:', error);
        
        // Reverte a mudança em caso de erro
        transaction.status = previousStatus;
        
        let errorMessage = 'Erro ao atualizar status';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showError(errorMessage);
        this.cdr.detectChanges();
      }
    });
  }

  deleteTransaction(id: number): void {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    console.log('Excluindo transação:', id);

    this.transactionService.deleteTransaction(id).subscribe({
      next: () => {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.applyFilter();
        this.showSuccess('Transação excluída com sucesso!');
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao excluir transação:', error);
        this.showError('Erro ao excluir transação');
      }
    });
  }

  toggleSelectAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.filteredTransactions.forEach(t => t.selected = checked);
  }

  trackByTransactionId(index: number, transaction: Transaction): number {
    return transaction.id;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['error-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar'],
      horizontalPosition: 'end',
      verticalPosition: 'top'
    });
  }
}