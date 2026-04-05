import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-700 to-green-500 p-4 relative overflow-hidden">
      <div class="absolute w-[500px] h-[500px] -top-[150px] -right-[100px] rounded-full bg-white/[0.04]"></div>
      <div class="absolute w-[350px] h-[350px] -bottom-[100px] -left-[80px] rounded-full bg-white/[0.04]"></div>
      <div class="bg-white/[0.97] rounded-2xl p-12 max-w-[480px] w-full text-center shadow-2xl relative z-10 animate-scale-in">
        <div class="w-[72px] h-[72px] bg-gradient-to-br from-green-50 to-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <svg class="w-9 h-9 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>
        <h1 class="text-7xl font-extrabold bg-gradient-to-br from-green-600 to-green-400 bg-clip-text text-transparent mb-2 leading-none">404</h1>
        <h2 class="text-xl font-semibold text-slate-800 mb-3">Stranica nije pronađena</h2>
        <p class="text-sm text-slate-500 mb-8 leading-relaxed">Stranica koju tražite ne postoji ili je premeštena.</p>
        <button class="z-btn z-btn-primary z-btn-lg" (click)="goHome()">Idi na početnu</button>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class NotFoundComponent {
  constructor(private router: Router) {}
  goHome(): void { this.router.navigate(['/home']); }
}
