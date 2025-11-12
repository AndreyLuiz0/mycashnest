import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { Transaction, TransactionService } from '../../services/transaction.service';
import { CommonModule } from '@angular/common';




interface Message {
  text: string;
  isBot: boolean;
  isOption?: boolean;
  action?: () => void;
}





@Component({
  selector: 'app-chatbot',
  standalone:true,
  imports: [CommonModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.scss'
})



export class ChatbotComponent implements OnDestroy {
  isOpen = false;
  isTyping = false;
  messages: Message[] = [];
  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private authService: AuthService,
    private transactionService: TransactionService
  ) {
    this.initChat();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initChat(): void {
    this.messages = [
      { 
        text: 'Olá! 👋 Sou seu assistente virtual. Como posso ajudar você hoje?', 
        isBot: true 
      }
    ];
    
    setTimeout(() => {
      this.showOptions();
    }, 800);
  }

  toggleChat(): void {
    this.isOpen = !this.isOpen;
  }

  showOptions(): void {
    const options = [
      { 
        text: '📊 Consultar Extrato', 
        action: () => this.handleExtratoOption() 
      },
      { 
        text: '💰 Ver Saldo', 
        action: () => this.handleSaldoOption() 
      },
      { 
        text: '🎓 Acessar Curso de Educação Financeira', 
        action: () => this.handleCursoOption() 
      }
    ];

    options.forEach((opt, index) => {
      setTimeout(() => {
        this.messages.push({
          text: opt.text,
          isBot: false,
          isOption: true,
          action: opt.action
        });
      }, index * 200);
    });
  }

  handleExtratoOption(): void {
    this.addUserMessage('📊 Consultar Extrato');
    this.showTyping();
    
    setTimeout(() => {
      this.isTyping = false;
      this.messages.push({
        text: 'Perfeito! Estou te redirecionando para a página de extrato onde você poderá ver todas as suas transações. 🔍',
        isBot: true
      });
      
      setTimeout(() => {
        this.router.navigate(['/extrato']);
      }, 1500);
    }, 1500);
  }

  handleSaldoOption(): void {
    this.addUserMessage('💰 Ver Saldo');
    this.showTyping();
    
    this.transactionService.getTransactions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (transactions) => {
          const saldo = this.calcularSaldo(transactions);
          
          this.isTyping = false;
          this.messages.push({
            text: `Seu saldo atual é de ${this.formatarMoeda(saldo)}. 💵\n\nPrecisa de mais alguma coisa?`,
            isBot: true
          });
          
          setTimeout(() => {
            this.showOptions();
          }, 1000);
        },
        error: (error) => {
          console.error('Erro ao buscar saldo:', error);
          this.isTyping = false;
          this.messages.push({
            text: 'Ops! Tive um problema ao buscar seu saldo. Tente novamente em instantes. 😅',
            isBot: true
          });
          
          setTimeout(() => {
            this.showOptions();
          }, 1000);
        }
      });
  }

  handleCursoOption(): void {
    this.addUserMessage('🎓 Acessar Curso de Educação Financeira');
    this.showTyping();
    
    setTimeout(() => {
      this.isTyping = false;
      this.messages.push({
        text: 'Ótima escolha! Vou te redirecionar para nosso curso de educação financeira. Você aprenderá sobre investimentos, planejamento e muito mais! 🚀',
        isBot: true
      });
      
      setTimeout(() => {
        // Substitua pela URL real do seu curso
        window.open('https://exemplo.com/curso-educacao-financeira', '_blank');
        
        this.messages.push({
          text: 'O curso foi aberto em uma nova aba. Posso ajudar com mais alguma coisa?',
          isBot: true
        });
        
        setTimeout(() => {
          this.showOptions();
        }, 1000);
      }, 2000);
    }, 1500);
  }

  private addUserMessage(text: string): void {
    // Remove as opções anteriores
    this.messages = this.messages.filter(m => !m.isOption);
    
    this.messages.push({
      text: text,
      isBot: false
    });
  }

  private showTyping(): void {
    this.isTyping = true;
  }

  private calcularSaldo(transactions: Transaction[]): number {
    return transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + (t.amount || 0) : acc - (t.amount || 0);
    }, 0);
  }

  private formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  }

  resetChat(): void {
    this.messages = [];
    this.initChat();
  }
}
