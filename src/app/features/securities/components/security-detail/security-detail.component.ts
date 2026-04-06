import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { NavbarComponent } from '../../../../shared/components/navbar/navbar.component';
import { SecuritiesService } from '../../services/securities.service';
import {
  Security,
  Future,
  Forex,
  PriceHistory,
} from '../../models/security.model';

type Period = 'day' | 'week' | 'month' | 'year' | '5year' | 'all';

interface DetailRow {
  label: string;
  value: string;
}

@Component({
  selector: 'app-security-detail',
  standalone: true,
  imports: [CommonModule, NavbarComponent],
  templateUrl: './security-detail.component.html',
  styleUrls: ['./security-detail.component.scss'],
})
export class SecurityDetailComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private readonly destroy$ = new Subject<void>();

  securityType: 'future' | 'forex' = 'future';
  ticker = '';

  security: Security | null = null;
  priceHistory: PriceHistory | null = null;
  isLoading = true;
  errorMessage = '';

  selectedPeriod: Period = 'month';

  periods: { value: Period; label: string }[] = [
    { value: 'day', label: 'Dan' },
    { value: 'week', label: 'Nedelja' },
    { value: 'month', label: 'Mesec' },
    { value: 'year', label: 'Godina' },
    { value: '5year', label: '5 God' },
    { value: 'all', label: 'Početak' },
  ];

  detailRows: DetailRow[] = [];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly securitiesService: SecuritiesService
  ) {}

  ngOnInit(): void {
    this.securityType = this.route.snapshot.data['securityType'];
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      this.ticker = params['ticker'];
      this.loadSecurity();
    });
  }

  ngAfterViewInit(): void {
    // Chart will be drawn after data is loaded
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSecurity(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const request$: Observable<Security> =
      this.securityType === 'future'
        ? this.securitiesService.getFutureByTicker(this.ticker)
        : this.securitiesService.getForexByTicker(this.ticker);

    request$.pipe(takeUntil(this.destroy$)).subscribe({
      next: (security: Security) => {
        this.security = security;
        this.buildDetailRows();
        this.loadPriceHistory();
      },
      error: (err: Error) => {
        console.error('Error loading security:', err);
        this.errorMessage = 'Greška pri učitavanju hartije od vrednosti.';
        this.isLoading = false;
      },
    });
  }

  loadPriceHistory(): void {
    this.securitiesService
      .getPriceHistory(this.ticker, this.selectedPeriod)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (history) => {
          this.priceHistory = history;
          this.isLoading = false;
          setTimeout(() => this.drawChart(), 0);
        },
        error: (err) => {
          console.error('Error loading price history:', err);
          this.isLoading = false;
        },
      });
  }

  selectPeriod(period: Period): void {
    this.selectedPeriod = period;
    this.loadPriceHistory();
  }

  buildDetailRows(): void {
    if (!this.security) return;

    if (this.securityType === 'future') {
      const future = this.security as Future;
      this.detailRows = [
        { label: 'Otvaranje', value: this.formatPrice(future.open) },
        { label: 'Najviša', value: this.formatPrice(future.high) },
        { label: 'Najniža', value: this.formatPrice(future.low) },
        { label: 'Prethodno zatvaranje', value: this.formatPrice(future.previousClose) },
        { label: 'Datum izmirenja', value: future.settlementDate },
        { label: 'Veličina ugovora', value: future.contractSize.toString() },
        { label: 'Otvoreni interes', value: this.formatVolume(future.openInterest) },
      ];
    } else {
      const forex = this.security as Forex;
      this.detailRows = [
        { label: 'Otvaranje', value: this.formatPrice(forex.open) },
        { label: 'Najviša', value: this.formatPrice(forex.high) },
        { label: 'Najniža', value: this.formatPrice(forex.low) },
        { label: 'Prethodno zatvaranje', value: this.formatPrice(forex.previousClose) },
        { label: 'Bid', value: forex.bid.toFixed(4) },
        { label: 'Ask', value: forex.ask.toFixed(4) },
        { label: 'Spread', value: forex.spread.toFixed(4) },
      ];
    }
  }

  drawChart(): void {
    if (!this.chartCanvas || !this.priceHistory?.data?.length) return;

    const canvas = this.chartCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const data = this.priceHistory.data;
    const padding = 40;
    const width = rect.width;
    const height = rect.height;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Find min/max prices
    const prices = data.map((d) => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Draw grid lines
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();

      // Price labels
      const price = maxPrice - (priceRange / 4) * i;
      ctx.fillStyle = '#6b7280';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText(price.toFixed(2), padding - 5, y + 4);
    }

    // Draw line chart
    ctx.beginPath();
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';

    data.forEach((point, index) => {
      const x = padding + (chartWidth / (data.length - 1)) * index;
      const y = padding + chartHeight - ((point.price - minPrice) / priceRange) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Fill area under line
    const lastX = padding + chartWidth;
    const lastY = padding + chartHeight - ((data[data.length - 1].price - minPrice) / priceRange) * chartHeight;

    ctx.lineTo(lastX, height - padding);
    ctx.lineTo(padding, height - padding);
    ctx.closePath();

    const gradient = ctx.createLinearGradient(0, padding, 0, height - padding);
    gradient.addColorStop(0, 'rgba(22, 163, 74, 0.3)');
    gradient.addColorStop(1, 'rgba(22, 163, 74, 0.05)');
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw date labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';

    const labelCount = Math.min(5, data.length);
    for (let i = 0; i < labelCount; i++) {
      const dataIndex = Math.floor((i / (labelCount - 1)) * (data.length - 1));
      const x = padding + (chartWidth / (data.length - 1)) * dataIndex;
      const date = new Date(data[dataIndex].date);
      const label = date.toLocaleDateString('sr-RS', { month: 'short', year: '2-digit' });
      ctx.fillText(label, x, height - padding + 15);
    }
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('sr-RS', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  formatVolume(volume: number): string {
    return new Intl.NumberFormat('sr-RS').format(volume);
  }

  formatChange(change: number, changePercent: number): string {
    const sign = change >= 0 ? '+' : '';
    return `${sign}${changePercent.toFixed(2)}%`;
  }

  getChangeClass(change: number): string {
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  }

  goBack(): void {
    this.router.navigate(['/securities']);
  }
}
