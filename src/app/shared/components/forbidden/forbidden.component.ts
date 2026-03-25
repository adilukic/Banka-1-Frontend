import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-forbidden',
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-900 via-green-700 to-green-500 p-4 relative overflow-hidden">
      <div class="absolute w-[500px] h-[500px] -top-[150px] -right-[100px] rounded-full bg-white/[0.04]"></div>
      <div class="absolute w-[350px] h-[350px] -bottom-[100px] -left-[80px] rounded-full bg-white/[0.04]"></div>
      <div class="bg-white/[0.97] rounded-2xl p-12 max-w-[480px] w-full text-center shadow-2xl relative z-10 animate-scale-in">
        <div class="w-[72px] h-[72px] bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md">
          <svg class="w-9 h-9 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h1 class="text-7xl font-extrabold text-red-500 mb-2 leading-none">403</h1>
        <h2 class="text-xl font-semibold text-slate-800 mb-3">Pristup odbijen</h2>
        <p class="text-sm text-slate-500 mb-8 leading-relaxed">Nemate dozvolu za pristup ovoj stranici. Kontaktirajte administratora ako smatrate da je ovo greška.</p>
        <button class="z-btn z-btn-primary z-btn-lg" (click)="goHome()">Idi na početnu</button>
      </div>
    </div>
  `,
  styles: [`:host { display: block; }`]
})
export class ForbiddenComponent {
  constructor(private router: Router) {}
  goHome(): void { this.router.navigate(['/home']); }
}
