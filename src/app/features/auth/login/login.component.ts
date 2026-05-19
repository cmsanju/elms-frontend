import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  loading = false;
  error = '';
  showPassword = false;

  features = [
    { icon: '🧠', label: 'AI-Generated MCQ & Coding Assessments' },
    { icon: '😊', label: 'Real-time Emotion Detection Interview' },
    { icon: '🎤', label: 'Voice-Powered AI Chatbot' },
    { icon: '📄', label: 'Document Intelligence & Analysis' },
    { icon: '🏆', label: 'AI-Signed Course Certificates' },
    { icon: '🗺️', label: 'Personalized AI Learning Paths' },
  ];

  stats = [
    { value: '50K+', label: 'Learners' },
    { value: '200+', label: 'AI Courses' },
    { value: '98%', label: 'Satisfaction' },
  ];

  onSubmit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';

    const { email, password } = this.form.value;
    this.authService.login(email!, password!).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err) => {
        this.error = err.error?.error || 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  demoLogin(role: string) {
    const creds: any = {
      STUDENT: { email: 'student@elms.com', password: 'demo123' },
      INSTRUCTOR: { email: 'instructor@elms.com', password: 'demo123' },
      ADMIN: { email: 'admin@elms.com', password: 'demo123' }
    };
    this.form.setValue(creds[role]);
    this.onSubmit();
  }
}
