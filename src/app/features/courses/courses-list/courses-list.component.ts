import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AiService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';

interface Course {
  id: number;
  title: string;
  description: string;
  category: string;
  skillLevel: string;
  duration: string;
  instructor: string;
  thumbnail: string;
  enrolled: boolean;
  progress: number;
  rating: number;
  students: number;
  tags: string[];
}

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
<div class="courses-page">
  <div class="page-header">
    <div class="ph-left">
      <a routerLink="/dashboard" class="back-btn">← Dashboard</a>
      <h1>📚 Course Library</h1>
      <p>Explore AI-curated courses tailored to your learning goals</p>
    </div>
    <div class="ph-right">
      <div class="search-box">
        <span>🔍</span>
        <input [(ngModel)]="searchQuery" (ngModelChange)="filterCourses()"
          placeholder="Search courses..."/>
      </div>
    </div>
  </div>

  <!-- Filters -->
  <div class="filter-row">
    <button class="filter-btn" *ngFor="let cat of categories"
      [class.active]="selectedCategory === cat"
      (click)="selectedCategory = cat; filterCourses()">{{ cat }}</button>
  </div>

  <!-- AI Recommendation Banner -->
  <div class="ai-rec-banner" *ngIf="aiRecommendation()">
    <div class="arb-icon">🤖</div>
    <div class="arb-content">
      <div class="arb-title">AI Learning Path Recommendation</div>
      <div class="arb-text">{{ aiRecommendation() }}</div>
    </div>
    <button class="arb-close" (click)="aiRecommendation.set('')">✕</button>
  </div>

  <!-- Course Grid -->
  <div class="courses-grid">
    <div class="course-card" *ngFor="let course of filteredCourses()">
      <div class="cc-thumb" [style.background]="getCourseGradient(course.category)">
        <span class="cc-emoji">{{ getCategoryEmoji(course.category) }}</span>
        <div class="cc-level">{{ course.skillLevel }}</div>
      </div>
      <div class="cc-body">
        <div class="cc-category">{{ course.category }}</div>
        <h3 class="cc-title">{{ course.title }}</h3>
        <p class="cc-desc">{{ course.description }}</p>
        <div class="cc-tags">
          <span class="cc-tag" *ngFor="let tag of course.tags.slice(0,3)">{{ tag }}</span>
        </div>
        <div class="cc-meta">
          <span>👨‍🏫 {{ course.instructor }}</span>
          <span>⏱ {{ course.duration }}</span>
          <span>⭐ {{ course.rating }}</span>
          <span>👥 {{ course.students }}</span>
        </div>
        <div class="cc-progress" *ngIf="course.enrolled && course.progress > 0">
          <div class="cp-bar">
            <div class="cp-fill" [style.width.%]="course.progress"></div>
          </div>
          <span>{{ course.progress }}% complete</span>
        </div>
        <div class="cc-actions">
          <a [routerLink]="['/courses', course.id]" class="btn-view">View Course</a>
          <button class="btn-enroll" *ngIf="!course.enrolled" (click)="enroll(course)">
            Enroll Now
          </button>
          <a [routerLink]="['/assessment/mcq']" class="btn-continue" *ngIf="course.enrolled">
            Continue →
          </a>
        </div>
      </div>
    </div>
  </div>

  <!-- Empty state -->
  <div class="empty-state" *ngIf="filteredCourses().length === 0">
    <div>🔍</div>
    <h3>No courses found</h3>
    <p>Try a different search or category filter</p>
  </div>
</div>
  `,
  styleUrls: ['./courses-list.component.scss']
})
export class CoursesListComponent implements OnInit {
  private aiService = inject(AiService);
  private authService = inject(AuthService);

  searchQuery = '';
  selectedCategory = 'All';
  aiRecommendation = signal('');

  categories = ['All', 'Backend', 'Frontend', 'AI/ML', 'DevOps', 'Data Science', 'Mobile'];

  allCourses: Course[] = [
    {
      id: 1, title: 'Full Stack Java with Spring Boot & Angular', description: 'Master enterprise Java development with Spring Boot microservices and Angular 20 frontend.',
      category: 'Backend', skillLevel: 'Intermediate', duration: '40h', instructor: 'Dr. Ravi Kumar',
      thumbnail: '', enrolled: true, progress: 65, rating: 4.8, students: 12400,
      tags: ['Java', 'Spring Boot', 'Angular', 'MySQL']
    },
    {
      id: 2, title: 'AI & Machine Learning with Python', description: 'Comprehensive ML/DL course covering neural networks, NLP, and computer vision with hands-on projects.',
      category: 'AI/ML', skillLevel: 'Advanced', duration: '60h', instructor: 'Dr. Priya Sharma',
      thumbnail: '', enrolled: false, progress: 0, rating: 4.9, students: 8900,
      tags: ['Python', 'TensorFlow', 'PyTorch', 'NLP']
    },
    {
      id: 3, title: 'Angular 20 - Complete Developer Guide', description: 'Master Angular 20 with signals, standalone components, zoneless change detection and SSR.',
      category: 'Frontend', skillLevel: 'Intermediate', duration: '30h', instructor: 'Arjun Mehta',
      thumbnail: '', enrolled: true, progress: 30, rating: 4.7, students: 6200,
      tags: ['Angular', 'TypeScript', 'RxJS', 'Signals']
    },
    {
      id: 4, title: 'DevOps with Docker, Kubernetes & CI/CD', description: 'Deploy and scale applications using modern DevOps practices, containers, and cloud infrastructure.',
      category: 'DevOps', skillLevel: 'Advanced', duration: '45h', instructor: 'Suresh Nair',
      thumbnail: '', enrolled: false, progress: 0, rating: 4.6, students: 5100,
      tags: ['Docker', 'Kubernetes', 'Jenkins', 'AWS']
    },
    {
      id: 5, title: 'React & Next.js Full Stack Development', description: 'Build production-ready React applications with Next.js 14, server components, and modern patterns.',
      category: 'Frontend', skillLevel: 'Intermediate', duration: '35h', instructor: 'Nisha Patel',
      thumbnail: '', enrolled: false, progress: 0, rating: 4.8, students: 9300,
      tags: ['React', 'Next.js', 'Node.js', 'TypeScript']
    },
    {
      id: 6, title: 'Data Science & Analytics Bootcamp', description: 'From data wrangling to visualizations and predictive models — become a data science pro.',
      category: 'Data Science', skillLevel: 'Beginner', duration: '50h', instructor: 'Dr. Anita Roy',
      thumbnail: '', enrolled: false, progress: 0, rating: 4.7, students: 7800,
      tags: ['Python', 'Pandas', 'SQL', 'Tableau']
    },
    {
      id: 7, title: 'Generative AI & LLM Engineering', description: 'Build applications with GPT-4, Gemini, Claude, LangChain and vector databases.',
      category: 'AI/ML', skillLevel: 'Advanced', duration: '40h', instructor: 'Vikram Iyer',
      thumbnail: '', enrolled: false, progress: 0, rating: 4.9, students: 11200,
      tags: ['LLMs', 'LangChain', 'RAG', 'Gemini AI']
    },
    {
      id: 8, title: 'Flutter & Dart Mobile Development', description: 'Build beautiful cross-platform mobile apps for iOS and Android with Flutter 3.',
      category: 'Mobile', skillLevel: 'Beginner', duration: '38h', instructor: 'Kiran Reddy',
      thumbnail: '', enrolled: false, progress: 0, rating: 4.6, students: 4600,
      tags: ['Flutter', 'Dart', 'Firebase', 'Animations']
    },
  ];

  filteredCourses = signal<Course[]>([...this.allCourses]);

  ngOnInit() {
    this.loadAIRecommendation();
  }

  loadAIRecommendation() {
    const user = this.authService.getUser();
    const skills = user?.skills || 'Programming';
    this.aiService.recommendCourses(skills, 'Become a senior developer', 'HTML basics')
      .subscribe({
        next: (res: any) => {
          try {
            const rec = typeof res.recommendations === 'string'
              ? JSON.parse(res.recommendations) : res.recommendations;
            this.aiRecommendation.set(
              `Based on your skills in ${skills}, AI recommends focusing on: ${rec?.learningPath || 'Full Stack Development'}. Estimated completion: ${rec?.estimatedCompletion || '3 months'}`
            );
          } catch { }
        }
      });
  }

  filterCourses() {
    let result = [...this.allCourses];
    if (this.selectedCategory !== 'All') {
      result = result.filter(c => c.category === this.selectedCategory);
    }
    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    this.filteredCourses.set(result);
  }

  enroll(course: Course) {
    course.enrolled = true;
    course.progress = 0;
    this.filteredCourses.set([...this.filteredCourses()]);
  }

  getCourseGradient(category: string): string {
    const map: Record<string, string> = {
      'Backend': 'linear-gradient(135deg, #1a0533, #3b0764)',
      'Frontend': 'linear-gradient(135deg, #0c1a3d, #1e3a8a)',
      'AI/ML': 'linear-gradient(135deg, #0d2818, #14532d)',
      'DevOps': 'linear-gradient(135deg, #2d1b00, #7c2d12)',
      'Data Science': 'linear-gradient(135deg, #1a1a2e, #16213e)',
      'Mobile': 'linear-gradient(135deg, #1a0030, #4a044e)',
    };
    return map[category] || 'linear-gradient(135deg, #111827, #1f2937)';
  }

  getCategoryEmoji(category: string): string {
    const map: Record<string, string> = {
      'Backend': '⚙️', 'Frontend': '🎨', 'AI/ML': '🤖',
      'DevOps': '🚀', 'Data Science': '📊', 'Mobile': '📱'
    };
    return map[category] || '📚';
  }
}
