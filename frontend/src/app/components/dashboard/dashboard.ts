import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';

import { AuthService, User } from '../../services/auth.service';
import { TransactionService, Transaction } from '../../services/transaction.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class DashboardComponent implements OnInit {
  currentUser: User | null = null;
  recentTransactions: Transaction[] = [];
  currentMonth = new Date();
  weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];
  calendarDays: any[] = [];
  showProfileMenu = false;

  // Dados dos gráficos
  categoryChartData: ChartConfiguration<'pie'>['data'] = {
    labels: ['Categoria 1', 'Categoria 2', 'Categoria 3'],
    datasets: [{
      data: [40, 35, 25],
      backgroundColor: ['#4caf50', '#2196f3', '#ff9800'],
      borderWidth: 0
    }]
  };

  marginChartData: ChartConfiguration<'doughnut'>['data'] = {
    labels: ['Lucro', 'Despesas'],
    datasets: [{
      data: [70, 30],
      backgroundColor: ['#4caf50', '#f44336'],
      borderWidth: 0
    }]
  };

  trendChartData: ChartConfiguration<'line'>['data'] = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    datasets: [
      {
        data: [65, 59, 80, 81, 56, 55],
        label: 'Receitas',
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        tension: 0.4
      },
      {
        data: [28, 48, 40, 19, 86, 27],
        label: 'Despesas',
        borderColor: '#f44336',
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        tension: 0.4
      }
    ]
  };

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr'],
    datasets: [
      {
        data: [65, 59, 80, 81],
        label: 'Receitas',
        backgroundColor: '#4caf50'
      },
      {
        data: [28, 48, 40, 19],
        label: 'Despesas',
        backgroundColor: '#f44336'
      }
    ]
  };

  categoryLegend = [
    { label: 'categoria 1', color: '#4caf50' },
    { label: 'categoria 2', color: '#2196f3' },
    { label: 'categoria 3', color: '#ff9800' }
  ];

  chartOptions: ChartOptions<'pie'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  donutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    }
  };

  lineChartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  barChartOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      }
    },
    scales: {
      y: {
        beginAtZero: true
      }
    }
  };

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.currentUser = this.authService.getCurrentUser();
    this.loadDashboardData();
    this.generateCalendar();
  }

  loadDashboardData(): void {
    // Carrega transações e atualiza todos os dados
    this.loadRecentTransactions();
    this.loadTransactionsForCharts();
  }

  loadRecentTransactions(): void {
    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        this.recentTransactions = transactions
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
          .slice(0, 8);
      },
      error: (error) => {
        console.error('Erro ao carregar transações:', error);
      }
    });
  }
  

  loadTransactionsForCharts(): void {
    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        this.updateChartsWithTransactions(transactions);
      },
      error: (error) => {
        console.error('Erro ao carregar transações para gráficos:', error);
      }
    });
  }

  updateChartsWithTransactions(transactions: Transaction[]): void {
    // Agrupar por categoria
    const categoryMap = new Map<string, number>();
    let totalIncome = 0;
    let totalExpense = 0;

    transactions.forEach(t => {
      const category = t.category || 'Sem categoria';
      const amount = t.amount || 0;

      if (t.type === 'expense') {
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
        totalExpense += amount;
      } else {
        totalIncome += amount;
      }
    });

    // Atualizar gráfico de categorias
    if (categoryMap.size > 0) {
      const categories = Array.from(categoryMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      const colors = ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'];

      this.categoryChartData = {
        labels: categories.map(([cat]) => cat),
        datasets: [{
          data: categories.map(([, total]) => total),
          backgroundColor: colors.slice(0, categories.length),
          borderWidth: 0
        }]
      };

      this.categoryLegend = categories.map(([cat], index) => ({
        label: cat,
        color: colors[index]
      }));
    }

    // Atualizar gráfico de margem (receitas vs despesas)
    const total = totalIncome + totalExpense;
    if (total > 0) {
      this.marginChartData = {
        labels: ['Receitas', 'Despesas'],
        datasets: [{
          data: [totalIncome, totalExpense],
          backgroundColor: ['#4caf50', '#f44336'],
          borderWidth: 0
        }]
      };
    }

    // Atualizar gráfico de tendências (últimos 6 meses)
    this.updateTrendChart(transactions);
  }

  updateTrendChart(transactions: Transaction[]): void {
    const now = new Date();
    const months: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    // Gerar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));

      // Calcular totais do mês
      let monthIncome = 0;
      let monthExpense = 0;

      transactions.forEach(t => {
        const tDate = new Date(t.date);
        if (tDate.getMonth() === date.getMonth() && tDate.getFullYear() === date.getFullYear()) {
          if (t.type === 'income') {
            monthIncome += t.amount || 0;
          } else {
            monthExpense += t.amount || 0;
          }
        }
      });

      incomeData.push(monthIncome);
      expenseData.push(monthExpense);
    }

    this.trendChartData = {
      labels: months,
      datasets: [
        {
          data: incomeData,
          label: 'Receitas',
          borderColor: '#4caf50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          tension: 0.4
        },
        {
          data: expenseData,
          label: 'Despesas',
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          tension: 0.4
        }
      ]
    };

    // Atualizar gráfico de barras (últimos 4 meses)
    this.barChartData = {
      labels: months.slice(2),
      datasets: [
        {
          data: incomeData.slice(2),
          label: 'Receitas',
          backgroundColor: '#4caf50'
        },
        {
          data: expenseData.slice(2),
          label: 'Despesas',
          backgroundColor: '#f44336'
        }
      ]
    };
  }

  updateChartsWithRealData(data: any): void {
    // Atualizar gráfico de categorias
    if (data.categoryStats && data.categoryStats.length > 0) {
      this.categoryChartData = {
        labels: data.categoryStats.map((cat: any) => cat.category || 'Sem categoria'),
        datasets: [{
          data: data.categoryStats.map((cat: any) => cat.total),
          backgroundColor: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'],
          borderWidth: 0
        }]
      };
      this.categoryLegend = data.categoryStats.map((cat: any, index: number) => ({
        label: cat.category || 'Sem categoria',
        color: ['#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#f44336'][index]
      }));
    }

    // Atualizar gráfico de margem
    const incomeTotal = data.incomeTotal || 0;
    const expenseTotal = data.expenseTotal || 0;
    const total = incomeTotal + expenseTotal;
    
    if (total > 0) {
      this.marginChartData = {
        labels: ['Receitas', 'Despesas'],
        datasets: [{
          data: [incomeTotal, expenseTotal],
          backgroundColor: ['#4caf50', '#f44336'],
          borderWidth: 0
        }]
      };
    }
  }

  navigateToExtrato(): void {
    this.router.navigate(['/extrato']);
  }

  generateCalendar(): void {
    const year = this.currentMonth.getFullYear();
    const month = this.currentMonth.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    this.calendarDays = [];
    
    // Carregar transações do mês para marcar no calendário
    this.transactionService.getTransactions().subscribe({
      next: (transactions) => {
        const transactionDates = new Set(
          transactions
            .filter(t => {
              const tDate = new Date(t.date);
              return tDate.getMonth() === month && tDate.getFullYear() === year;
            })
            .map(t => new Date(t.date).getDate())
        );

        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          this.calendarDays.push({
            day: date.getDate(),
            date: new Date(date),
            active: date.getMonth() === month && transactionDates.has(date.getDate()),
            isToday: this.isToday(date),
            isCurrentMonth: date.getMonth() === month
          });
        }
      },
      error: (error) => {
        console.error('Erro ao carregar transações para o calendário:', error);
        // Gera calendário sem marcações em caso de erro
        for (let i = 0; i < 42; i++) {
          const date = new Date(startDate);
          date.setDate(startDate.getDate() + i);
          
          this.calendarDays.push({
            day: date.getDate(),
            date: new Date(date),
            active: false,
            isToday: this.isToday(date),
            isCurrentMonth: date.getMonth() === month
          });
        }
      }
    });
  }

  isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  previousMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() - 1
    );
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentMonth = new Date(
      this.currentMonth.getFullYear(),
      this.currentMonth.getMonth() + 1
    );
    this.generateCalendar();
  }

   toggleProfileMenu(): void {
    this.showProfileMenu = !this.showProfileMenu;
  }

  logout(): void {
    if (confirm('Deseja realmente sair?')) {
      this.authService.logout();
      this.router.navigate(['/login']);
    }
  }
}