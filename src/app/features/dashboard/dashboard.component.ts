import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AiService } from '../../core/services/ai.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private aiService = inject(AiService);

  user = this.authService.currentUser;
  recommendations = signal<any>(null);
  loadingRec = signal(false);
  currentTime = new Date();

  navItems = [
    { icon: '🏠', label: 'Dashboard', route: '/dashboard', active: true },
    { icon: '📚', label: 'Courses', route: '/courses' },
    { icon: '🧠', label: 'AI Assessment', route: '/assessment' },
    { icon: '🎤', label: 'AI Interview', route: '/interview' },
    { icon: '🤖', label: 'AI Chatbot', route: '/chatbot' },
    { icon: '🏆', label: 'Certificates', route: '/certificates' },
  ];

  statsCards = [
    { icon: '📖', label: 'Courses Enrolled', value: 5, color: '#6c63ff', trend: '+2 this month' },
    { icon: '✅', label: 'Assessments Passed', value: 12, color: '#00d4ff', trend: '92% avg score' },
    { icon: '🎤', label: 'Interviews Done', value: 3, color: '#ff6b6b', trend: '+1 this week' },
    { icon: '🏆', label: 'Certificates Earned', value: 4, color: '#ffd700', trend: 'Latest: Java' },
  ];

  quickActions = [
    { icon: '🧠', label: 'MCQ Quiz', desc: 'AI-generated questions', route: '/assessment/mcq', color: '#6c63ff' },
    { icon: '💻', label: 'Code Challenge', desc: 'Real-world problems', route: '/assessment/coding', color: '#00d4ff' },
    { icon: '🎤', label: 'Mock Interview', desc: 'AI + emotion detection', route: '/interview', color: '#ff6b6b' },
    { icon: '🤖', label: 'Ask AI', desc: 'Voice & doc support', route: '/chatbot', color: '#00c896' },
  ];

  ngOnInit() {
    this.loadRecommendations();
    setInterval(() => this.currentTime = new Date(), 1000);
  }

  loadRecommendations() {
    const user = this.user();
    if (!user) return;
    this.loadingRec.set(true);
    this.aiService.recommendCourses(
      user.skills || 'Programming',
      'Become a full-stack developer',
      'HTML, CSS Basics'
    ).subscribe({
      next: (res: any) => {
        try {
          const rec = typeof res.recommendations === 'string'
            ? JSON.parse(res.recommendations) : res.recommendations;
          this.recommendations.set(rec);
        } catch { this.recommendations.set(null); }
        this.loadingRec.set(false);
      },
      error: () => this.loadingRec.set(false)
    });
  }

  logout() { this.authService.logout(); }

  getGreeting(): string {
    const h = this.currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }
}
