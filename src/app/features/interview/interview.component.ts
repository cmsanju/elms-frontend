import { Component, inject, signal, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';

type Stage = 'setup' | 'active' | 'evaluating' | 'done';

interface EmotionSnapshot {
  timestamp: number;
  dominant: string;
  scores: Record<string, number>;
}

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './interview.component.html',
  styleUrls: ['./interview.component.scss']
})
export class InterviewComponent implements AfterViewInit, OnDestroy {
  @ViewChild('videoEl') videoEl!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasEl') canvasEl!: ElementRef<HTMLCanvasElement>;

  private aiService = inject(AiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // State
  stage = signal<Stage>('setup');
  config = { role: 'Full Stack Developer', skills: 'Java, Spring Boot, Angular', questionCount: 6 };
  questions = signal<any[]>([]);
  currentQIdx = signal(0);
  answers: any[] = [];
  currentAnswer = '';
  submittingAnswer = signal(false);
  liveFeedback = signal('');

  // Emotion detection
  emotionData: EmotionSnapshot[] = [];
  currentEmotion = signal('NEUTRAL');
  emotionScores = signal<Record<string, number>>({});
  cameraActive = signal(false);
  private emotionInterval: any;
  private faceApiLoaded = false;

  // Camera stream
  private stream: MediaStream | null = null;

  // Speech recognition
  recognition: any;
  isListening = signal(false);
  transcript = signal('');

  // Session
  sessionId = signal('');
  totalTimeLeft = signal(3600);
  private timerInterval: any;

  async ngAfterViewInit() {
    await this.loadFaceApi();
  }

  async loadFaceApi() {
    // face-api.js is loaded via CDN in index.html for demo
    // In production install: npm install face-api.js
    try {
      if ((window as any).faceapi) {
        const faceapi = (window as any).faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
        await faceapi.nets.faceExpressionNet.loadFromUri('/assets/models');
        this.faceApiLoaded = true;
        console.log('face-api.js loaded successfully');
      }
    } catch (e) {
      console.log('face-api.js models not loaded (demo mode) — emotion simulation active');
    }
  }

  async startInterview() {
    this.aiService.startInterview(this.config.role, this.config.skills, this.config.questionCount)
      .subscribe({
        next: async (res: any) => {
          try {
            const qs = typeof res.questions === 'string' ? JSON.parse(res.questions) : res.questions;
            this.questions.set(Array.isArray(qs) ? qs : []);
            this.sessionId.set(res.sessionId);
            this.stage.set('active');
            this.startTimer();
            await this.startCamera();
            this.startEmotionDetection();
            this.setupSpeechRecognition();
          } catch (e) { alert('Failed to start interview. Check backend.'); }
        },
        error: () => alert('Interview start failed. Ensure backend is running.')
      });
  }

  async startCamera() {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (this.videoEl?.nativeElement) {
        this.videoEl.nativeElement.srcObject = this.stream;
        this.cameraActive.set(true);
      }
    } catch (e) {
      console.log('Camera not available — using simulated emotion data');
      this.cameraActive.set(false);
      this.simulateEmotions();
    }
  }

  startEmotionDetection() {
    if (!this.faceApiLoaded) {
      this.simulateEmotions();
      return;
    }

    this.emotionInterval = setInterval(async () => {
      try {
        const faceapi = (window as any).faceapi;
        const detections = await faceapi
          .detectAllFaces(this.videoEl.nativeElement, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        if (detections.length > 0) {
          const expressions = detections[0].expressions;
          const dominant = Object.entries(expressions).reduce((a: any, b: any) => b[1] > a[1] ? b : a)[0];
          this.currentEmotion.set(dominant.toUpperCase());
          this.emotionScores.set(expressions);
          this.emotionData.push({ timestamp: Date.now(), dominant: dominant.toUpperCase(), scores: expressions });
        }
      } catch {}
    }, 2000);
  }

  simulateEmotions() {
    const emotions = ['CONFIDENT', 'NEUTRAL', 'HAPPY', 'NERVOUS', 'FOCUSED', 'CONFUSED'];
    const weights =  [0.35,        0.25,      0.2,     0.1,       0.08,      0.02];

    this.emotionInterval = setInterval(() => {
      const r = Math.random();
      let cumulative = 0;
      let selected = 'NEUTRAL';
      for (let i = 0; i < emotions.length; i++) {
        cumulative += weights[i];
        if (r < cumulative) { selected = emotions[i]; break; }
      }
      this.currentEmotion.set(selected);
      const scores: Record<string, number> = {};
      emotions.forEach(e => scores[e.toLowerCase()] = Math.random() * 0.3);
      scores[selected.toLowerCase()] = 0.6 + Math.random() * 0.4;
      this.emotionScores.set(scores);
      this.emotionData.push({ timestamp: Date.now(), dominant: selected, scores });
    }, 3000);
  }

  setupSpeechRecognition() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = (event: any) => {
      const results = Array.from(event.results as SpeechRecognitionResultList);
      const transcript = results.map((r: any) => r[0].transcript).join(' ');
      this.transcript.set(transcript);
      this.currentAnswer = transcript;
    };
    this.recognition.onerror = () => this.isListening.set(false);
    this.recognition.onend = () => this.isListening.set(false);
  }

  toggleListening() {
    if (!this.recognition) { alert('Speech recognition not supported in this browser.'); return; }
    if (this.isListening()) {
      this.recognition.stop();
      this.isListening.set(false);
    } else {
      this.transcript.set('');
      this.recognition.start();
      this.isListening.set(true);
    }
  }

  submitAnswer() {
    const q = this.questions()[this.currentQIdx()];
    const answer = this.currentAnswer.trim();
    if (!answer) { alert('Please provide an answer.'); return; }
    this.submittingAnswer.set(true);

    this.aiService.submitAnswer(q.question, answer, JSON.stringify(q.expectedKeyPoints || []))
      .subscribe({
        next: (res: any) => {
          try {
            const eval_ = typeof res.evaluation === 'string' ? JSON.parse(res.evaluation) : res.evaluation;
            this.answers.push({ question: q.question, answer, evaluation: eval_, questionData: q });
            this.liveFeedback.set(eval_?.feedback || '');
          } catch {
            this.answers.push({ question: q.question, answer, evaluation: null, questionData: q });
          }
          this.submittingAnswer.set(false);
          setTimeout(() => {
            if (this.currentQIdx() < this.questions().length - 1) {
              this.currentQIdx.update(v => v + 1);
              this.currentAnswer = '';
              this.transcript.set('');
              this.liveFeedback.set('');
            } else {
              this.finishInterview();
            }
          }, 1500);
        },
        error: () => {
          this.submittingAnswer.set(false);
          this.answers.push({ question: q.question, answer, evaluation: null });
          this.nextQuestion();
        }
      });
  }

  nextQuestion() {
    if (this.currentQIdx() < this.questions().length - 1) {
      this.currentQIdx.update(v => v + 1);
      this.currentAnswer = '';
      this.transcript.set('');
      this.liveFeedback.set('');
    } else {
      this.finishInterview();
    }
  }

  finishInterview() {
    clearInterval(this.timerInterval);
    clearInterval(this.emotionInterval);
    this.stopCamera();
    this.stage.set('evaluating');

    const user = this.authService.getUser();
    this.aiService.completeInterview(
      this.answers,
      this.emotionData.slice(-20),
      this.config.role,
      user?.fullName || 'Candidate'
    ).subscribe({
      next: (res: any) => {
        this.stage.set('done');
        // Navigate to results with state
        this.router.navigate(['/interview/result'], {
          state: {
            report: res.report,
            answers: this.answers,
            emotionData: this.emotionData,
            config: this.config,
            candidateName: user?.fullName
          }
        });
      },
      error: () => {
        this.stage.set('done');
        this.router.navigate(['/interview/result'], {
          state: { report: null, answers: this.answers, config: this.config }
        });
      }
    });
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    if (this.recognition) this.recognition.stop();
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.totalTimeLeft.update(v => v > 0 ? v - 1 : 0);
    }, 1000);
  }

  formatTime(s: number): string {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }

  getEmotionEmoji(emotion: string): string {
    const map: Record<string, string> = {
      CONFIDENT: '😎', HAPPY: '😄', NEUTRAL: '😐', NERVOUS: '😰',
      FOCUSED: '🎯', CONFUSED: '😕', SURPRISED: '😮', ANGRY: '😤'
    };
    return map[emotion] || '😐';
  }

  getEmotionColor(emotion: string): string {
    const map: Record<string, string> = {
      CONFIDENT: '#00c896', HAPPY: '#ffd700', NEUTRAL: '#6c63ff',
      NERVOUS: '#ff6b6b', FOCUSED: '#00d4ff', CONFUSED: '#ff8c00'
    };
    return map[emotion] || '#6c63ff';
  }

  ngOnDestroy() {
    clearInterval(this.timerInterval);
    clearInterval(this.emotionInterval);
    this.stopCamera();
  }
}
