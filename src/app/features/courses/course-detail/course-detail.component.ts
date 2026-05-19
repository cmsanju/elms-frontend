import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { AiService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="detail-page">
  <!-- Back nav -->
  <div class="top-nav">
    <a routerLink="/courses" class="back-btn">← All Courses</a>
    <div class="nav-actions">
      <a [routerLink]="['/assessment/mcq']" class="btn-assess">🧠 Take Assessment</a>
      <a [routerLink]="['/certificate/new']" class="btn-cert">🏆 Get Certificate</a>
    </div>
  </div>

  <div class="detail-layout">
    <!-- Main Content -->
    <div class="detail-main">
      <div class="course-hero">
        <div class="ch-badge">{{ course().category }}</div>
        <h1>{{ course().title }}</h1>
        <p class="ch-desc">{{ course().description }}</p>
        <div class="ch-meta">
          <span>👨‍🏫 {{ course().instructor }}</span>
          <span>⏱ {{ course().duration }}</span>
          <span>⭐ {{ course().rating }}/5</span>
          <span>👥 {{ course().students }} students</span>
          <span class="level-badge" [class]="course().level?.toLowerCase()">{{ course().level }}</span>
        </div>
      </div>

      <!-- Course Tabs -->
      <div class="tabs">
        <button *ngFor="let tab of tabs" class="tab" [class.active]="activeTab() === tab"
          (click)="activeTab.set(tab)">{{ tab }}</button>
      </div>

      <!-- Overview Tab -->
      <div class="tab-content" *ngIf="activeTab() === 'Overview'">
        <div class="section-card">
          <h3>📋 What You'll Learn</h3>
          <div class="learn-grid">
            <div class="learn-item" *ngFor="let item of course().whatYouLearn">
              <span class="li-check">✓</span>
              <span>{{ item }}</span>
            </div>
          </div>
        </div>

        <div class="section-card">
          <h3>📚 Curriculum</h3>
          <div class="curriculum">
            <div class="module" *ngFor="let mod of course().curriculum; let i = index">
              <div class="mod-header" (click)="toggleModule(i)">
                <span class="mod-num">{{ i + 1 }}</span>
                <span class="mod-title">{{ mod.title }}</span>
                <span class="mod-lessons">{{ mod.lessons.length }} lessons</span>
                <span class="mod-arrow">{{ expandedModules[i] ? '▲' : '▼' }}</span>
              </div>
              <div class="mod-lessons-list" *ngIf="expandedModules[i]">
                <div class="lesson-item" *ngFor="let lesson of mod.lessons">
                  <span class="li-icon">{{ getLessonIcon(lesson.type) }}</span>
                  <span class="li-title">{{ lesson.title }}</span>
                  <span class="li-duration">{{ lesson.duration }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- AI Q&A Tab -->
      <div class="tab-content" *ngIf="activeTab() === 'AI Q&A'">
        <div class="section-card">
          <h3>🤖 Ask AI About This Course</h3>
          <p class="qa-sub">Ask any question about the course content — Gemini AI answers instantly</p>

          <div class="qa-messages">
            <div class="qa-msg" *ngFor="let msg of qaMessages()" [class.user]="msg.role === 'user'">
              <div class="qm-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
              <div class="qm-content">
                <div class="qm-text">{{ msg.content }}</div>
                <div class="qm-time">{{ msg.time }}</div>
              </div>
            </div>
            <div class="qa-msg" *ngIf="loadingAnswer()">
              <div class="qm-avatar">🤖</div>
              <div class="qm-content">
                <div class="loading-dots"><span></span><span></span><span></span></div>
              </div>
            </div>
          </div>

          <div class="qa-input-row">
            <input [(ngModel)]="qaInput" (keydown.enter)="askQuestion()"
              placeholder="Ask anything about {{ course().title }}..."/>
            <button (click)="askQuestion()" [disabled]="!qaInput.trim() || loadingAnswer()">
              {{ loadingAnswer() ? '⟳' : '→' }}
            </button>
          </div>

          <div class="suggested-questions">
            <span>Try:</span>
            <button class="sq-btn" *ngFor="let sq of suggestedQuestions()"
              (click)="qaInput = sq; askQuestion()">{{ sq }}</button>
          </div>
        </div>
      </div>

      <!-- Assessment Tab -->
      <div class="tab-content" *ngIf="activeTab() === 'Assessment'">
        <div class="section-card">
          <h3>🧠 AI-Powered Course Assessments</h3>
          <p style="color:rgba(255,255,255,0.5);font-size:14px;margin-bottom:24px;">
            Test your knowledge with AI-generated questions tailored to this course
          </p>
          <div class="assess-grid">
            <a [routerLink]="['/assessment/mcq']" class="assess-card">
              <div class="ac-icon">📝</div>
              <div class="ac-title">MCQ Assessment</div>
              <div class="ac-desc">AI generates unique questions each time</div>
              <div class="ac-action">Start Quiz →</div>
            </a>
            <a [routerLink]="['/assessment/coding']" class="assess-card">
              <div class="ac-icon">💻</div>
              <div class="ac-title">Coding Challenge</div>
              <div class="ac-desc">Real-world coding problems with AI evaluation</div>
              <div class="ac-action">Start Coding →</div>
            </a>
            <a [routerLink]="['/certificate/new']" class="assess-card">
              <div class="ac-icon">🏆</div>
              <div class="ac-title">Final Exam & Certificate</div>
              <div class="ac-desc">Complete course assessment + AI-signed certificate</div>
              <div class="ac-action">Take Exam →</div>
            </a>
          </div>
        </div>
      </div>
    </div>

    <!-- Sidebar -->
    <div class="detail-sidebar">
      <div class="sidebar-card">
        <div class="sc-header">
          <div class="sc-progress-ring">
            <svg viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>
              <circle cx="40" cy="40" r="34" fill="none" stroke="#6c63ff" stroke-width="8"
                stroke-dasharray="213.6"
                [attr.stroke-dashoffset]="213.6 - (213.6 * progress() / 100)"
                stroke-linecap="round"
                transform="rotate(-90 40 40)"/>
            </svg>
            <div class="ring-text">{{ progress() }}%</div>
          </div>
          <div class="sc-progress-label">Course Progress</div>
        </div>

        <div class="sc-actions">
          <button class="sc-btn primary">▶ Continue Learning</button>
          <button class="sc-btn secondary" (click)="progress.set(Math.min(100, progress() + 10))">
            ✓ Mark Lesson Done
          </button>
        </div>

        <div class="sc-info">
          <div class="si-row"><span>📅 Duration</span><strong>{{ course().duration }}</strong></div>
          <div class="si-row"><span>📚 Lessons</span><strong>{{ course().totalLessons }}</strong></div>
          <div class="si-row"><span>📊 Level</span><strong>{{ course().level }}</strong></div>
          <div class="si-row"><span>🌐 Language</span><strong>English</strong></div>
          <div class="si-row"><span>♾️ Access</span><strong>Lifetime</strong></div>
          <div class="si-row"><span>🏆 Certificate</span><strong>Yes, AI-signed</strong></div>
        </div>

        <div class="sc-tools">
          <h4>🛠 Quick Tools</h4>
          <a [routerLink]="['/chatbot']" class="tool-link">🤖 Ask AI Chatbot</a>
          <a [routerLink]="['/interview']" class="tool-link">🎤 Mock Interview</a>
          <a [routerLink]="['/assessment/mcq']" class="tool-link">🧠 Practice Quiz</a>
        </div>
      </div>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./course-detail.component.scss']
})
export class CourseDetailComponent implements OnInit {
  private aiService = inject(AiService);
  private route = inject(ActivatedRoute);
  private authService = inject(AuthService);

  Math = Math;
  tabs = ['Overview', 'AI Q&A', 'Assessment'];
  activeTab = signal('Overview');
  progress = signal(65);
  loadingAnswer = signal(false);
  qaInput = '';
  qaMessages = signal<any[]>([]);
  expandedModules: Record<number, boolean> = { 0: true };

  course = signal<any>({
    id: 1,
    title: 'Full Stack Java with Spring Boot & Angular',
    description: 'Master enterprise Java development with Spring Boot microservices and Angular 20. Build real-world production applications with AI integration, security, and cloud deployment.',
    category: 'Backend',
    instructor: 'Dr. Ravi Kumar',
    duration: '40 hours',
    level: 'Intermediate',
    rating: 4.8,
    students: 12400,
    totalLessons: 85,
    whatYouLearn: [
      'Build RESTful APIs with Spring Boot 3',
      'Implement JWT authentication & Spring Security',
      'Create Angular 20 reactive UIs with Signals',
      'Design MySQL schemas with JPA/Hibernate',
      'Integrate Gemini AI into enterprise applications',
      'Deploy with Docker & CI/CD pipelines',
      'Implement microservices architecture patterns',
      'Write unit & integration tests with JUnit 5',
    ],
    curriculum: [
      {
        title: 'Java & Spring Boot Foundations', lessons: [
          { title: 'Setting Up Development Environment', type: 'VIDEO', duration: '12m' },
          { title: 'Spring Boot Auto-configuration Deep Dive', type: 'VIDEO', duration: '25m' },
          { title: 'Building Your First REST API', type: 'VIDEO', duration: '30m' },
          { title: 'Dependency Injection & IoC Container', type: 'TEXT', duration: '15m' },
          { title: 'Module Quiz', type: 'QUIZ', duration: '10m' },
        ]
      },
      {
        title: 'Database & JPA with MySQL', lessons: [
          { title: 'MySQL Database Design Principles', type: 'VIDEO', duration: '20m' },
          { title: 'JPA Entities & Relationships', type: 'VIDEO', duration: '35m' },
          { title: 'Spring Data JPA Repositories', type: 'VIDEO', duration: '28m' },
          { title: 'Database Migrations with Flyway', type: 'VIDEO', duration: '22m' },
          { title: 'Coding Exercise: Blog System', type: 'CODING', duration: '60m' },
        ]
      },
      {
        title: 'Angular 20 Frontend', lessons: [
          { title: 'Angular Signals & Reactive Programming', type: 'VIDEO', duration: '40m' },
          { title: 'Standalone Components & New Control Flow', type: 'VIDEO', duration: '35m' },
          { title: 'HTTP Client & State Management', type: 'VIDEO', duration: '30m' },
          { title: 'Angular Material & Custom Themes', type: 'VIDEO', duration: '25m' },
        ]
      },
      {
        title: 'AI Integration with Gemini', lessons: [
          { title: 'Gemini AI API Introduction', type: 'VIDEO', duration: '20m' },
          { title: 'Building AI-Powered Features', type: 'VIDEO', duration: '45m' },
          { title: 'Prompt Engineering Best Practices', type: 'VIDEO', duration: '30m' },
          { title: 'Final Project: AI-Powered Application', type: 'CODING', duration: '120m' },
        ]
      },
    ]
  });

  suggestedQuestions = signal<string[]>([]);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    this.generateSuggestedQuestions();
  }

  generateSuggestedQuestions() {
    const qs = [
      `What are the prerequisites for ${this.course().title}?`,
      'Explain the project architecture used in this course',
      'What is the difference between @Service and @Component in Spring Boot?',
      'How does JWT authentication work in Spring Security?',
    ];
    this.suggestedQuestions.set(qs);
  }

  askQuestion() {
    const q = this.qaInput.trim();
    if (!q) return;

    const userMsg = { role: 'user', content: q, time: new Date().toLocaleTimeString() };
    this.qaMessages.update(msgs => [...msgs, userMsg]);
    this.qaInput = '';
    this.loadingAnswer.set(true);

    this.aiService.askAI(q, this.course().title, this.course().category).subscribe({
      next: (res: any) => {
        const aiMsg = {
          role: 'ai',
          content: res.answer || 'I could not find an answer. Please try rephrasing.',
          time: new Date().toLocaleTimeString()
        };
        this.qaMessages.update(msgs => [...msgs, aiMsg]);
        this.loadingAnswer.set(false);
      },
      error: () => {
        this.qaMessages.update(msgs => [...msgs, {
          role: 'ai',
          content: '⚠️ AI service unavailable. Please check that the backend is running.',
          time: new Date().toLocaleTimeString()
        }]);
        this.loadingAnswer.set(false);
      }
    });
  }

  toggleModule(index: number) {
    this.expandedModules[index] = !this.expandedModules[index];
  }

  getLessonIcon(type: string): string {
    const map: Record<string, string> = {
      VIDEO: '▶', TEXT: '📄', QUIZ: '❓', CODING: '💻'
    };
    return map[type] || '📄';
  }
}
