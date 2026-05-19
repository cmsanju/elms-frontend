import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AiService } from '../../../core/services/ai.service';

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: string;
  skill: string;
}

@Component({
  selector: 'app-mcq',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="mcq-page">
  <div class="page-header">
    <a routerLink="/dashboard" class="back-btn">← Back</a>
    <h1>🧠 AI-Generated MCQ Assessment</h1>
    <p>Gemini AI creates personalized questions based on your skill and difficulty</p>
  </div>

  <!-- Configuration Panel -->
  <div class="config-panel" *ngIf="!started()">
    <div class="config-grid">
      <div class="field">
        <label>Skill / Topic</label>
        <input [(ngModel)]="config.skill" placeholder="e.g. Java, Python, React..." />
      </div>
      <div class="field">
        <label>Specific Topic</label>
        <input [(ngModel)]="config.topic" placeholder="e.g. Spring Boot, Hooks..." />
      </div>
      <div class="field">
        <label>Difficulty</label>
        <select [(ngModel)]="config.difficulty">
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>
      <div class="field">
        <label>Number of Questions</label>
        <select [(ngModel)]="config.count">
          <option [value]="5">5 Questions</option>
          <option [value]="10">10 Questions</option>
          <option [value]="15">15 Questions</option>
        </select>
      </div>
    </div>
    <button class="btn-generate" (click)="generateQuestions()" [disabled]="generating()">
      <span *ngIf="!generating()">⚡ Generate AI Questions</span>
      <span *ngIf="generating()" class="spin">🔄 Gemini AI is creating questions...</span>
    </button>
  </div>

  <!-- Quiz Active -->
  <div class="quiz-active" *ngIf="started() && !showResults()">
    <div class="quiz-header">
      <div class="progress-info">
        <span>Question {{ currentQ() + 1 }} of {{ questions().length }}</span>
        <div class="progress-bar"><div class="progress-fill" [style.width.%]="((currentQ()+1)/questions().length)*100"></div></div>
      </div>
      <div class="timer-badge">⏱ {{ formatTime(timeLeft()) }}</div>
    </div>

    <div class="question-card" *ngIf="currentQuestion()">
      <div class="q-meta">
        <span class="q-skill">{{ currentQuestion().skill }}</span>
        <span class="q-diff" [class]="currentQuestion().difficulty.toLowerCase()">{{ currentQuestion().difficulty }}</span>
      </div>
      <h2 class="q-text">{{ currentQuestion().question }}</h2>

      <div class="options-list">
        <button class="option-btn"
          *ngFor="let opt of currentQuestion().options; let i = index"
          [class.selected]="selectedAnswers()[currentQ()] === i"
          [class.correct]="answered() && i === currentQuestion().correctAnswer"
          [class.wrong]="answered() && selectedAnswers()[currentQ()] === i && i !== currentQuestion().correctAnswer"
          (click)="selectAnswer(i)" [disabled]="answered()">
          <span class="opt-label">{{ ['A','B','C','D'][i] }}</span>
          {{ opt }}
        </button>
      </div>

      <div class="explanation" *ngIf="answered()">
        <div class="exp-title">💡 Explanation</div>
        <p>{{ currentQuestion().explanation }}</p>
      </div>
    </div>

    <div class="quiz-controls">
      <button class="btn-skip" (click)="nextQuestion()">{{ answered() ? 'Next →' : 'Skip →' }}</button>
    </div>
  </div>

  <!-- Results -->
  <div class="results-panel" *ngIf="showResults()">
    <div class="score-circle" [class.pass]="passedQuiz()" [class.fail]="!passedQuiz()">
      <div class="score-num">{{ scorePercent() }}%</div>
      <div class="score-lbl">{{ passedQuiz() ? '🎉 PASSED' : '😔 FAILED' }}</div>
    </div>

    <div class="result-stats">
      <div class="rs-item"><span>✅ Correct</span><strong>{{ correctCount() }}</strong></div>
      <div class="rs-item"><span>❌ Wrong</span><strong>{{ questions().length - correctCount() }}</strong></div>
      <div class="rs-item"><span>📊 Score</span><strong>{{ scorePercent() }}%</strong></div>
    </div>

    <div class="ai-feedback" *ngIf="aiFeedback()">
      <div class="feedback-title">🤖 AI Feedback</div>
      <p>{{ aiFeedback() }}</p>
    </div>

    <div class="result-actions">
      <button class="btn-retry" (click)="reset()">🔄 Try Again</button>
      <a class="btn-cert" routerLink="/certificate/new" *ngIf="passedQuiz()">🏆 Get Certificate</a>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./mcq.component.scss']
})
export class McqComponent {
  private aiService = inject(AiService);

  config = { skill: 'Java', topic: 'Spring Boot', difficulty: 'MEDIUM', count: 10 };
  generating = signal(false);
  started = signal(false);
  questions = signal<Question[]>([]);
  currentQ = signal(0);
  selectedAnswers = signal<Record<number, number>>({});
  answered = signal(false);
  showResults = signal(false);
  aiFeedback = signal('');
  timeLeft = signal(600);
  private timer: any;

  currentQuestion = computed(() => this.questions()[this.currentQ()]);
  correctCount = computed(() => {
    return this.questions().filter((q, i) => this.selectedAnswers()[i] === q.correctAnswer).length;
  });
  scorePercent = computed(() => Math.round((this.correctCount() / this.questions().length) * 100));
  passedQuiz = computed(() => this.scorePercent() >= 60);

  generateQuestions() {
    this.generating.set(true);
    this.aiService.generateMCQ(this.config.skill, this.config.topic, this.config.count, this.config.difficulty)
      .subscribe({
        next: (res: any) => {
          try {
            const parsed = typeof res.questions === 'string' ? JSON.parse(res.questions) : res.questions;
            if (Array.isArray(parsed)) {
              this.questions.set(parsed);
              this.started.set(true);
              this.startTimer();
            }
          } catch (e) { alert('Failed to parse questions. Retry.'); }
          this.generating.set(false);
        },
        error: () => { this.generating.set(false); alert('AI service error. Check backend.'); }
      });
  }

  selectAnswer(idx: number) {
    if (this.answered()) return;
    const current = { ...this.selectedAnswers() };
    current[this.currentQ()] = idx;
    this.selectedAnswers.set(current);
    this.answered.set(true);
  }

  nextQuestion() {
    this.answered.set(false);
    if (this.currentQ() < this.questions().length - 1) {
      this.currentQ.update(v => v + 1);
    } else {
      this.finishQuiz();
    }
  }

  finishQuiz() {
    clearInterval(this.timer);
    this.showResults.set(true);
    this.aiService.submitMCQ(this.selectedAnswers(), this.questions(), this.config.skill)
      .subscribe({
        next: (res: any) => {
          try {
            const r = typeof res.result === 'string' ? JSON.parse(res.result) : res.result;
            this.aiFeedback.set(r.feedback || '');
          } catch {}
        }
      });
  }

  startTimer() {
    this.timeLeft.set(this.config.count * 60);
    this.timer = setInterval(() => {
      this.timeLeft.update(v => {
        if (v <= 0) { clearInterval(this.timer); this.finishQuiz(); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  formatTime(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  reset() {
    this.started.set(false);
    this.questions.set([]);
    this.currentQ.set(0);
    this.selectedAnswers.set({});
    this.answered.set(false);
    this.showResults.set(false);
    this.aiFeedback.set('');
    clearInterval(this.timer);
  }
}
