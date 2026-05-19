import { Component, inject, signal, OnInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AiService } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';

interface CertData {
  studentName:       string;
  courseName:        string;
  score:             string;
  skills:            string;
  instructorName:    string;
  certificateNumber: string;
  issuedDate:        string;
  aiMessage:         string;
}

@Component({
  selector: 'app-certificate',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './certificate.component.html',
  styleUrls:   ['./certificate.component.scss']
})
export class CertificateComponent implements OnInit {
  @ViewChild('certRef') certRef!: ElementRef<HTMLDivElement>;

  private aiService   = inject(AiService);
  private authService = inject(AuthService);

  user       = this.authService.currentUser;
  generating = signal(false);
  certData   = signal<CertData | null>(null);

  form = {
    studentName:    '',
    courseName:     '',
    score:          '85',
    skills:         '',
    instructorName: 'Dr. AI Instructor'
  };

  ngOnInit() {
    this.form.studentName = this.user()?.fullName || '';
    this.form.skills      = this.user()?.skills   || '';
  }

  generate() {
    if (!this.form.studentName.trim() || !this.form.courseName.trim()) {
      alert('Please enter Student Name and Course Name.');
      return;
    }
    this.generating.set(true);
    this.certData.set(null);

    this.aiService.generateCertificate(this.form).subscribe({
      next: (res: any) => {
        this.certData.set(res as CertData);
        this.generating.set(false);
      },
      error: () => {
        this.generating.set(false);
        alert('Certificate generation failed. Make sure the backend is running.');
      }
    });
  }

  reset() { this.certData.set(null); }

  print() { window.print(); }

  copyNumber() {
    const num = this.certData()?.certificateNumber || '';
    navigator.clipboard.writeText(num).then(() => alert('Copied: ' + num));
  }

  initials(name: string): string {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  scoreColor(score: string): string {
    const n = parseInt(score, 10);
    if (n >= 90) return '#00c896';
    if (n >= 75) return '#FFD700';
    return '#ff8c00';
  }
}
