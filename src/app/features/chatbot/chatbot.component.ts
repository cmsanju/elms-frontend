import { Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AiService } from '../../core/services/ai.service';
import { AuthService } from '../../core/services/auth.service';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  type: 'text' | 'voice' | 'document';
  timestamp: Date;
  loading?: boolean;
  docName?: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss']
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('chatEnd') chatEnd!: ElementRef;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  private aiService = inject(AiService);
  private authService = inject(AuthService);

  user = this.authService.currentUser;
  messages = signal<Message[]>([
    {
      id: '0',
      role: 'ai',
      content: `👋 Hello ${this.authService.getUser()?.fullName || 'there'}! I'm your ELMS AI Assistant powered by Gemini AI.

I can help you with:
• 📚 **Course recommendations** and learning paths
• 💻 **Code review** and programming help
• 🎤 **Voice-powered queries** — just click the mic!
• 📄 **Document analysis** — upload PDFs or DOCX files
• 🧠 **Technical concepts** explained clearly
• 🎯 **Interview preparation** tips and mock questions

What would you like to explore today?`,
      type: 'text',
      timestamp: new Date()
    }
  ]);

  inputText = '';
  isLoading = signal(false);
  isListening = signal(false);
  uploadedFile = signal<File | null>(null);
  docQuery = '';
  showDocPanel = signal(false);

  // Speech recognition
  recognition: any;
  transcript = signal('');

  // Quick prompts
  quickPrompts = [
    '💡 Explain RESTful APIs',
    '💻 Review my Java code',
    '🎯 Interview tips for Java Developer',
    '📚 Recommend Python courses',
    '🚀 Spring Boot best practices',
    '🔥 What is Microservices?'
  ];

  constructor() {
    this.setupSpeechRecognition();
  }

  setupSpeechRecognition() {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    this.recognition = new SR();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
    this.recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      this.transcript.set(text);
      this.inputText = text;
      this.isListening.set(false);
      this.sendMessage('voice');
    };
    this.recognition.onerror = () => this.isListening.set(false);
    this.recognition.onend = () => this.isListening.set(false);
  }

  toggleVoice() {
    if (!this.recognition) { alert('Speech recognition not supported in this browser. Use Chrome/Edge.'); return; }
    if (this.isListening()) {
      this.recognition.stop();
      this.isListening.set(false);
    } else {
      this.recognition.start();
      this.isListening.set(true);
      this.transcript.set('');
    }
  }

  sendMessage(type: 'text' | 'voice' = 'text') {
    const text = this.inputText.trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      type,
      timestamp: new Date()
    };

    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      content: '',
      type: 'text',
      timestamp: new Date(),
      loading: true
    };

    this.messages.update(m => [...m, userMsg, loadingMsg]);
    this.inputText = '';
    this.isLoading.set(true);

    // Build conversation history
    const history = this.messages()
      .filter(m => !m.loading)
      .slice(-10)
      .map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');

    this.aiService.chat(text, history).subscribe({
      next: (res: any) => {
        const response = res.response || 'I apologize, I could not generate a response.';
        this.messages.update(msgs => msgs.map(m =>
          m.loading ? { ...m, content: response, loading: false } : m
        ));
        this.isLoading.set(false);
      },
      error: () => {
        this.messages.update(msgs => msgs.map(m =>
          m.loading ? { ...m, content: '⚠️ Connection error. Please check if the backend is running.', loading: false } : m
        ));
        this.isLoading.set(false);
      }
    });
  }

  useQuickPrompt(prompt: string) {
    this.inputText = prompt.replace(/^[^\s]+\s/, '');
    this.sendMessage();
  }

  onFileSelect(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.uploadedFile.set(file);
      this.showDocPanel.set(true);
    }
  }

  analyzeDocument() {
    const file = this.uploadedFile();
    if (!file) return;
    const query = this.docQuery || 'Summarize this document and highlight key points';

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `📄 Analyzing document: **${file.name}**\nQuery: ${query}`,
      type: 'document',
      timestamp: new Date(),
      docName: file.name
    };

    const loadingMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'ai', content: '', type: 'document',
      timestamp: new Date(), loading: true
    };

    this.messages.update(m => [...m, userMsg, loadingMsg]);
    this.showDocPanel.set(false);
    this.isLoading.set(true);

    this.aiService.analyzeDocument(file, query).subscribe({
      next: (res: any) => {
        const analysis = res.analysis || 'Document analyzed.';
        this.messages.update(msgs => msgs.map(m =>
          m.loading ? { ...m, content: `📄 **Document Analysis: ${file.name}**\n\n${analysis}`, loading: false } : m
        ));
        this.isLoading.set(false);
        this.uploadedFile.set(null);
        this.docQuery = '';
      },
      error: () => {
        this.messages.update(msgs => msgs.map(m =>
          m.loading ? { ...m, content: '⚠️ Document analysis failed.', loading: false } : m
        ));
        this.isLoading.set(false);
      }
    });
  }

  clearChat() {
    this.messages.set([{
      id: '0', role: 'ai',
      content: '🔄 Chat cleared. How can I help you?',
      type: 'text', timestamp: new Date()
    }]);
  }

  onEnterKey(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  ngAfterViewChecked() {
    if (this.chatEnd) {
      this.chatEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
    }
  }

  formatContent(content: string): string {
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<code>$1</code>')
      .replace(/\n/g, '<br>');
  }
}
