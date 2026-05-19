import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-interview-result',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
<div class="result-page">
  <div class="result-header">
    <a routerLink="/dashboard" class="back-btn">← Back to Dashboard</a>
    <h1>📊 Interview Report</h1>
    <p>AI-Generated Comprehensive Assessment</p>
  </div>

  <div class="result-body" *ngIf="report()">
    <!-- Score Overview -->
    <div class="score-overview">
      <div class="score-main" [class]="getRecommendationClass()">
        <div class="sm-num">{{ report()?.overallScore || 0 }}</div>
        <div class="sm-label">Overall Score</div>
        <div class="sm-rec" [class]="getRecommendationClass()">{{ report()?.recommendation }}</div>
      </div>

      <div class="score-breakdown">
        <div class="sb-item">
          <div class="sb-label">Technical</div>
          <div class="sb-bar">
            <div class="sb-fill" [style.width.%]="report()?.technicalScore" style="background: #6c63ff"></div>
          </div>
          <div class="sb-val">{{ report()?.technicalScore }}%</div>
        </div>
        <div class="sb-item">
          <div class="sb-label">Behavioral</div>
          <div class="sb-bar">
            <div class="sb-fill" [style.width.%]="report()?.behavioralScore" style="background: #00d4ff"></div>
          </div>
          <div class="sb-val">{{ report()?.behavioralScore }}%</div>
        </div>
        <div class="sb-item">
          <div class="sb-label">Communication</div>
          <div class="sb-bar">
            <div class="sb-fill" [style.width.%]="report()?.communicationScore" style="background: #00c896"></div>
          </div>
          <div class="sb-val">{{ report()?.communicationScore }}%</div>
        </div>
      </div>
    </div>

    <!-- Summary -->
    <div class="report-section">
      <h3>📋 Executive Summary</h3>
      <p class="summary-text">{{ report()?.summary }}</p>
    </div>

    <!-- Strengths & Development -->
    <div class="dual-columns">
      <div class="report-card strengths">
        <h3>✅ Strengths</h3>
        <ul>
          <li *ngFor="let s of report()?.strengths">{{ s }}</li>
        </ul>
      </div>
      <div class="report-card development">
        <h3>🎯 Development Areas</h3>
        <ul>
          <li *ngFor="let d of report()?.developmentAreas">{{ d }}</li>
        </ul>
      </div>
    </div>

    <!-- Detailed Feedback -->
    <div class="report-section">
      <h3>🤖 AI Detailed Feedback</h3>
      <p class="summary-text">{{ report()?.detailedFeedback }}</p>
    </div>

    <!-- Next Steps -->
    <div class="report-section" *ngIf="report()?.nextSteps?.length">
      <h3>🚀 Recommended Next Steps</h3>
      <div class="next-steps">
        <div class="ns-item" *ngFor="let step of report()?.nextSteps; let i = index">
          <span class="ns-num">{{ i + 1 }}</span>
          <p>{{ step }}</p>
        </div>
      </div>
    </div>

    <!-- Q&A Review -->
    <div class="report-section" *ngIf="answers()?.length">
      <h3>💬 Question-by-Question Review</h3>
      <div class="qa-review">
        <div class="qar-item" *ngFor="let a of answers(); let i = index">
          <div class="qar-header">
            <span class="qar-num">Q{{ i + 1 }}</span>
            <span class="qar-score" *ngIf="a.evaluation?.score">{{ a.evaluation.score }}%</span>
          </div>
          <p class="qar-question">{{ a.question }}</p>
          <div class="qar-answer">
            <strong>Your Answer:</strong>
            <p>{{ a.answer }}</p>
          </div>
          <div class="qar-feedback" *ngIf="a.evaluation?.feedback">
            <strong>AI Feedback:</strong>
            <p>{{ a.evaluation.feedback }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="result-actions">
      <a routerLink="/interview" class="btn-retry">🔄 Try Another Interview</a>
      <button class="btn-print" (click)="printReport()">🖨️ Print Report</button>
      <a routerLink="/assessment/mcq" class="btn-practice">📚 Practice Assessments</a>
    </div>
  </div>

  <div class="no-report" *ngIf="!report()">
    <div class="nr-icon">📊</div>
    <h2>No Report Available</h2>
    <p>Complete an interview to generate your report</p>
    <a routerLink="/interview" class="btn-retry">Start Interview →</a>
  </div>
</div>
  `,
  styleUrls: ['./interview-result.component.scss']
})
export class InterviewResultComponent implements OnInit {
  private router = inject(Router);
  report = signal<any>(null);
  answers = signal<any[]>([]);

  ngOnInit() {
    const state = this.router.getCurrentNavigation()?.extras?.state ||
                  history.state;
    if (state?.report) {
      try {
        const r = typeof state.report === 'string' ? JSON.parse(state.report) : state.report;
        this.report.set(r);
      } catch { this.report.set(null); }
    }
    if (state?.answers) this.answers.set(state.answers);
  }

  getRecommendationClass(): string {
    const rec = this.report()?.recommendation;
    if (rec === 'HIRE') return 'hire';
    if (rec === 'CONSIDER') return 'consider';
    return 'reject';
  }

  printReport() { window.print(); }
}
