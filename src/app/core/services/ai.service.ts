import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AiService {
  private readonly BASE = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  // ── Assessment ─────────────────────────────────────────────────────────────
  generateMCQ(skill: string, topic: string, count: number, difficulty: string): Observable<any> {
    return this.http.post(`${this.BASE}/assessment/generate-mcq`, { skill, topic, count: count.toString(), difficulty });
  }

  generateCodingAssessment(skill: string, language: string, difficulty: string): Observable<any> {
    return this.http.post(`${this.BASE}/assessment/generate-coding`, { skill, language, difficulty });
  }

  submitCode(code: string, problem: string, language: string): Observable<any> {
    return this.http.post(`${this.BASE}/assessment/submit-code`, { code, problem, language });
  }

  submitMCQ(answers: any, questions: any, skill: string): Observable<any> {
    return this.http.post(`${this.BASE}/assessment/submit-mcq`, {
      answers: JSON.stringify(answers),
      questions: JSON.stringify(questions),
      skill
    });
  }

  generateFinalAssessment(courseTitle: string, topics: string, questionCount: number): Observable<any> {
    return this.http.post(`${this.BASE}/assessment/final-assessment`, {
      courseTitle, topics, questionCount: questionCount.toString()
    });
  }

  askAI(question: string, skill: string, context: string = ''): Observable<any> {
    return this.http.post(`${this.BASE}/assessment/ask-ai`, { question, skill, context });
  }

  recommendCourses(skills: string, goals: string, completedCourses: string): Observable<any> {
    return this.http.post(`${this.BASE}/assessment/recommend`, { skills, goals, completedCourses });
  }

  // ── Interview ──────────────────────────────────────────────────────────────
  startInterview(role: string, skills: string, questionCount: number = 8): Observable<any> {
    return this.http.post(`${this.BASE}/interview/start`, {
      role, skills, questionCount: questionCount.toString()
    });
  }

  submitAnswer(question: string, answer: string, expectedKeyPoints: string): Observable<any> {
    return this.http.post(`${this.BASE}/interview/submit-answer`, { question, answer, expectedKeyPoints });
  }

  submitEmotionData(emotionData: any, context: string): Observable<any> {
    return this.http.post(`${this.BASE}/interview/emotion-data`, {
      emotionData: JSON.stringify(emotionData),
      context
    });
  }

  completeInterview(answers: any[], emotionAnalysis: any, role: string, candidateName: string): Observable<any> {
    return this.http.post(`${this.BASE}/interview/complete`, {
      answers: JSON.stringify(answers),
      emotionAnalysis: JSON.stringify(emotionAnalysis),
      role,
      candidateName
    });
  }

  getLiveFeedback(question: string, answer: string): Observable<any> {
    return this.http.post(`${this.BASE}/interview/live-feedback`, { question, answer });
  }

  generatePracticeScenario(role: string, type: string): Observable<any> {
    return this.http.post(`${this.BASE}/interview/practice`, { role, type });
  }

  // ── Chatbot ────────────────────────────────────────────────────────────────
  chat(message: string, history: string = '', context: string = ''): Observable<any> {
    return this.http.post(`${this.BASE}/chatbot/chat`, { message, history, context });
  }

  voiceChat(transcribedText: string, context: string = ''): Observable<any> {
    return this.http.post(`${this.BASE}/chatbot/voice-chat`, { transcribedText, context });
  }

  analyzeDocument(file: File, query: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('query', query);
    return this.http.post(`${this.BASE}/chatbot/analyze-document`, formData);
  }

  explainConcept(concept: string, level: string = 'BEGINNER'): Observable<any> {
    return this.http.post(`${this.BASE}/chatbot/explain`, { concept, level });
  }

  codeHelp(code: string, issue: string, language: string): Observable<any> {
    return this.http.post(`${this.BASE}/chatbot/code-help`, { code, issue, language });
  }

  // ── Certificate ────────────────────────────────────────────────────────────
  generateCertificate(data: any): Observable<any> {
    return this.http.post(`${this.BASE}/certificate/generate`, data);
  }
}
