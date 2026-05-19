import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AiService } from '../../../core/services/ai.service';

@Component({
  selector: 'app-coding',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="coding-page">
  <div class="page-header">
    <a routerLink="/dashboard" class="back-btn">← Back</a>
    <h1>💻 AI Coding Assessment</h1>
    <p>Solve AI-generated real-world programming challenges</p>
  </div>

  <!-- Config -->
  <div class="config-panel" *ngIf="!started()">
    <div class="config-grid">
      <div class="field">
        <label>Skill Area</label>
        <input [(ngModel)]="config.skill" placeholder="e.g. Data Structures, Algorithms..."/>
      </div>
      <div class="field">
        <label>Language</label>
        <select [(ngModel)]="config.language">
          <option value="Java">Java</option>
          <option value="Python">Python</option>
          <option value="JavaScript">JavaScript</option>
          <option value="C++">C++</option>
          <option value="TypeScript">TypeScript</option>
        </select>
      </div>
      <div class="field">
        <label>Difficulty</label>
        <select [(ngModel)]="config.difficulty">
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </select>
      </div>
    </div>
    <button class="btn-generate" (click)="generateProblem()" [disabled]="generating()">
      <span *ngIf="!generating()">⚡ Generate Coding Problem</span>
      <span *ngIf="generating()">🤖 Gemini AI generating problem...</span>
    </button>
  </div>

  <!-- Problem Workspace -->
  <div class="workspace" *ngIf="started() && !showResults()">
    <div class="problem-panel">
      <div class="problem-header">
        <div class="p-meta">
          <span class="p-badge skill">{{ problem()?.skill }}</span>
          <span class="p-badge" [class]="problem()?.difficulty?.toLowerCase()">{{ problem()?.difficulty }}</span>
          <span class="p-badge lang">{{ problem()?.language }}</span>
        </div>
        <div class="timer-badge">⏱ {{ formatTime(timeLeft()) }}</div>
      </div>

      <h2 class="p-title">{{ problem()?.title }}</h2>
      <p class="p-desc">{{ problem()?.description }}</p>

      <div class="constraints-box" *ngIf="problem()?.constraints">
        <strong>Constraints:</strong> {{ problem()?.constraints }}
      </div>

      <div class="examples" *ngIf="problem()?.examples?.length">
        <h4>Examples</h4>
        <div class="example" *ngFor="let ex of problem()?.examples; let i = index">
          <div class="ex-header">Example {{ i + 1 }}</div>
          <div class="ex-row"><span>Input:</span> <code>{{ ex.input }}</code></div>
          <div class="ex-row"><span>Output:</span> <code>{{ ex.output }}</code></div>
          <div class="ex-explain" *ngIf="ex.explanation">{{ ex.explanation }}</div>
        </div>
      </div>

      <div class="hints-section" *ngIf="problem()?.hints?.length">
        <button class="hint-toggle" (click)="showHints = !showHints">
          {{ showHints ? '🙈 Hide Hints' : '💡 Show Hints' }}
        </button>
        <div *ngIf="showHints" class="hints-list">
          <div *ngFor="let h of problem()?.hints; let i = index" class="hint-item">
            <strong>Hint {{ i+1 }}:</strong> {{ h }}
          </div>
        </div>
      </div>
    </div>

    <div class="editor-panel">
      <div class="editor-header">
        <span>📝 Code Editor — {{ config.language }}</span>
        <div class="editor-actions">
          <button class="btn-clear" (click)="clearCode()">🗑 Clear</button>
          <button class="btn-submit" (click)="submitCode()" [disabled]="submitting()">
            {{ submitting() ? '🤖 Evaluating...' : '🚀 Submit Code' }}
          </button>
        </div>
      </div>

      <textarea class="code-editor"
        [(ngModel)]="userCode"
        [placeholder]="problem()?.starterCode || '// Write your solution here'"
        spellcheck="false"
        (keydown.tab)="insertTab($event)">
      </textarea>

      <div class="live-feedback" *ngIf="liveFeedback()">
        <div class="lf-title">🤖 AI Live Hint</div>
        <p>{{ liveFeedback() }}</p>
      </div>
    </div>
  </div>

  <!-- Results -->
  <div class="results-panel" *ngIf="showResults()">
    <div class="eval-header">
      <div class="eval-score" [class.pass]="evaluation()?.passed" [class.fail]="!evaluation()?.passed">
        <div class="es-num">{{ evaluation()?.score }}%</div>
        <div class="es-label">{{ evaluation()?.passed ? '✅ PASSED' : '❌ NEEDS WORK' }}</div>
      </div>
    </div>

    <div class="eval-sections">
      <div class="eval-card">
        <h4>⚙️ Correctness</h4>
        <p>{{ evaluation()?.correctness }}</p>
      </div>
      <div class="eval-card">
        <h4>🚀 Efficiency</h4>
        <p>{{ evaluation()?.efficiency }}</p>
      </div>
      <div class="eval-card">
        <h4>✨ Code Quality</h4>
        <p>{{ evaluation()?.codeQuality }}</p>
      </div>
    </div>

    <div class="suggestions" *ngIf="evaluation()?.suggestions?.length">
      <h4>💡 Suggestions</h4>
      <ul>
        <li *ngFor="let s of evaluation()?.suggestions">{{ s }}</li>
      </ul>
    </div>

    <div class="overall-feedback">
      <h4>🤖 AI Overall Feedback</h4>
      <p>{{ evaluation()?.overallFeedback }}</p>
    </div>

    <div class="result-actions">
      <button class="btn-retry" (click)="reset()">🔄 New Problem</button>
      <button class="btn-retry" (click)="retryProblem()">♻️ Retry Same</button>
    </div>
  </div>
</div>
  `,
  styleUrls: ['./coding.component.scss']
})
export class CodingComponent {
  private aiService = inject(AiService);

  config = { skill: 'Data Structures', language: 'Java', difficulty: 'MEDIUM' };
  generating = signal(false);
  submitting = signal(false);
  started = signal(false);
  showResults = signal(false);
  problem = signal<any>(null);
  evaluation = signal<any>(null);
  liveFeedback = signal('');
  timeLeft = signal(1800);
  showHints = false;
  userCode = '';
  private timer: any;

  generateProblem() {
    this.generating.set(true);
    this.aiService.generateCodingAssessment(this.config.skill, this.config.language, this.config.difficulty)
      .subscribe({
        next: (res: any) => {
          try {
            const parsed = typeof res.assessment === 'string' ? JSON.parse(res.assessment) : res.assessment;
            this.problem.set(parsed);
            this.userCode = parsed.starterCode || '';
            this.started.set(true);
            this.startTimer();
          } catch { alert('Could not parse problem. Try again.'); }
          this.generating.set(false);
        },
        error: () => { this.generating.set(false); alert('AI error. Check backend.'); }
      });
  }

  submitCode() {
    if (!this.userCode.trim()) { alert('Please write some code first.'); return; }
    this.submitting.set(true);
    this.aiService.submitCode(this.userCode, JSON.stringify(this.problem()), this.config.language)
      .subscribe({
        next: (res: any) => {
          try {
            const parsed = typeof res.evaluation === 'string' ? JSON.parse(res.evaluation) : res.evaluation;
            this.evaluation.set(parsed);
            this.showResults.set(true);
            clearInterval(this.timer);
          } catch { alert('Evaluation parsing failed.'); }
          this.submitting.set(false);
        },
        error: () => { this.submitting.set(false); alert('Submission error.'); }
      });
  }

  insertTab(e: Event) {
    e.preventDefault();
    const ta = e.target as HTMLTextAreaElement;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    this.userCode = this.userCode.substring(0, start) + '    ' + this.userCode.substring(end);
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + 4; });
  }

  startTimer() {
    this.timeLeft.set(1800);
    this.timer = setInterval(() => {
      this.timeLeft.update(v => {
        if (v <= 0) { clearInterval(this.timer); this.submitCode(); return 0; }
        return v - 1;
      });
    }, 1000);
  }

  formatTime(s: number): string {
    return `${Math.floor(s/60).toString().padStart(2,'0')}:${(s%60).toString().padStart(2,'0')}`;
  }

  clearCode() { this.userCode = this.problem()?.starterCode || ''; }
  retryProblem() { this.showResults.set(false); this.userCode = this.problem()?.starterCode || ''; this.startTimer(); }
  reset() { this.started.set(false); this.showResults.set(false); this.problem.set(null); clearInterval(this.timer); }
}
