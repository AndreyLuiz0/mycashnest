import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interface atualizada com os novos status
export interface Transaction {
  id: number;
  userId?: number;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
  status: 'paid' | 'unpaid' | 'pending' | 'received';
  created_at?: string;
  updated_at?: string;
}

export interface CreateTransactionDto {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
  status: 'paid' | 'unpaid' | 'pending' | 'received';
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private apiUrl = 'http://localhost:3000/api'; // Ajuste conforme API

  constructor(private http: HttpClient) { }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.apiUrl}/transactions`);
  }

  getTransaction(id: number): Observable<Transaction> {
    return this.http.get<Transaction>(`${this.apiUrl}/transactions/${id}`);
  }

  createTransaction(transaction: CreateTransactionDto): Observable<Transaction> {
    return this.http.post<Transaction>(`${this.apiUrl}/transactions`, transaction);
  }

  updateTransaction(id: number, transaction: Partial<Transaction>): Observable<Transaction> {
    return this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}`, transaction);
  }

  updateTransactionStatus(id: number, transaction: Transaction): Observable<Transaction> {
  return this.http.put<Transaction>(`${this.apiUrl}/transactions/${id}`, transaction);
}

  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/transactions/${id}`);
  }

  // Buscar dados do dashboard
  getDashboardData(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/transactions/dashboard`);
  }
}