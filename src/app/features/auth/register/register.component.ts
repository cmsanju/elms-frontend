import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
<div class="register-page">
  <div class="register-card">
    <div class="reg-logo">
      <span>⚡</span>
      <span class="rt">ELMS AI</span>
    </div>
    <h2>Create Your Account</h2>
    <p class="sub">Join the world's most advanced AI-powered learning platform</p>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="field-row">
        <div class="field">
          <label>Full Name</label>
          <input type="text" formControlName="fullName" placeholder="Your full name"/>
        </div>
        <div class="field">
          <label>Role</label>
          <select formControlName="role">
            <option value="STUDENT">Student</option>
            <option value="INSTRUCTOR">Instructor</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label>Email Address</label>
        <input type="email" formControlName="email" placeholder="your@email.com"/>
      </div>
      <div class="field">
        <label>Password</label>
        <input type="password" formControlName="password" placeholder="Min 6 characters"/>
      </div>
      <div class="field">
        <label>Your Skills (comma-separated)</label>
        <input type="text" formControlName="skills" placeholder="e.g. Java, Python, React, Spring Boot"/>
      </div>

      <div class="error" *ngIf="error">⚠️ {{ error }}</div>

      <button type="submit" [disabled]="loading || form.invalid">
        {{ loading ? '⟳ Creating Account...' : 'Create Account →' }}
      </button>
    </form>

    <div class="footer-link">
      Already have an account? <a routerLink="/auth/login">Sign In →</a>
    </div>
  </div>
</div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Syne:wght@700;800&display=swap');
    .register-page { min-height: 100vh; background: #060a14; display: flex; align-items: center; justify-content: center; padding: 24px; font-family: 'Space Grotesk', sans-serif; color: #fff; }
    .register-card { width: 100%; max-width: 500px; background: #0d1220; border: 1px solid rgba(255,255,255,0.06); border-radius: 24px; padding: 40px; }
    .reg-logo { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; font-size: 24px;
      .rt { font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; background: linear-gradient(135deg, #6c63ff, #00d4ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; } }
    h2 { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800; margin-bottom: 6px; }
    .sub { color: rgba(255,255,255,0.4); font-size: 13px; margin-bottom: 28px; }
    .field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .field { margin-bottom: 18px;
      label { display: block; font-size: 12px; color: rgba(255,255,255,0.45); margin-bottom: 7px; font-weight: 500; }
      input, select { width: 100%; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 14px; color: #fff; font-size: 14px; font-family: 'Space Grotesk', sans-serif; outline: none; transition: border-color 0.2s; option { background: #0d1220; } &:focus { border-color: #6c63ff; } } }
    .error { background: rgba(255,107,107,0.1); border: 1px solid rgba(255,107,107,0.3); color: #ff6b6b; border-radius: 10px; padding: 12px 16px; font-size: 14px; margin-bottom: 16px; }
    button[type="submit"] { width: 100%; padding: 15px; background: linear-gradient(135deg, #6c63ff, #00d4ff); border: none; border-radius: 12px; color: #fff; font-size: 16px; font-weight: 700; font-family: 'Space Grotesk', sans-serif; cursor: pointer; transition: all 0.3s; &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(108,99,255,0.4); } &:disabled { opacity: 0.55; cursor: not-allowed; } }
    .footer-link { text-align: center; margin-top: 20px; font-size: 14px; color: rgba(255,255,255,0.4); a { color: #6c63ff; text-decoration: none; font-weight: 600; &:hover { color: #00d4ff; } } }
  `]
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    role: ['STUDENT'],
    skills: ['']
  });

  loading = false;
  error = '';

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.authService.register(this.form.value).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => { this.error = err.error?.error || 'Registration failed.'; this.loading = false; }
    });
  }
}
