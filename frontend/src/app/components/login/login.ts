import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  showRegister = false;
  
  registerData = {
    name: '',
    email: '',
    password: ''
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.showError('Por favor, preencha todos os campos');
      return;
    }

    this.loading = true;
    this.authService.login(this.email, this.password).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        this.showError(error.error?.error || 'Erro ao fazer login');
      }
    });
  }

  register(): void {
    if (!this.registerData.name || !this.registerData.email || !this.registerData.password) {
      this.showError('Por favor, preencha todos os campos');
      return;
    }

    this.loading = true;
    this.authService.register(
      this.registerData.name,
      this.registerData.email,
      this.registerData.password
    ).subscribe({
      next: () => {
        this.loading = false;
        this.showRegister = false;
        this.router.navigate(['/dashboard']);
        this.showSuccess('Cadastro realizado com sucesso!');
      },
      error: (error) => {
        this.loading = false;
        this.showError(error.error?.error || 'Erro ao realizar cadastro');
      }
    });
  }

  loginWithGoogle(): void {
    this.showError('Login com Google em desenvolvimento');
  }

  closeRegister(): void {
    this.showRegister = false;
    this.registerData = { name: '', email: '', password: '' };
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }
}