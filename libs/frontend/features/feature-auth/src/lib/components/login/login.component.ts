import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'lib-login',
  standalone: true,
  template: `
    <!-- Navigation -->
    <nav class="nav">
      <div class="nav-inner">
        <div class="nav-brand">
          <div class="nav-logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#2563eb"/>
              <path d="M8 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
              <circle cx="14" cy="10" r="2.5" fill="white"/>
              <path d="M10 18h8M11 20h6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span class="nav-title">TripHub</span>
        </div>
        <button class="nav-cta" (click)="login()">Sign in</button>
      </div>
    </nav>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-inner">
        <div class="hero-badge">Plan · Collaborate · Explore</div>
        <h1 class="hero-heading">
          Your trips,<br>
          <span class="hero-heading-accent">planned together.</span>
        </h1>
        <p class="hero-sub">
          TripHub brings your whole travel crew into one place —
          destinations, budgets, packing lists, and more.
          No more scattered spreadsheets or endless group chats.
        </p>
        <div class="hero-actions">
          <button class="btn-primary" (click)="login()">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.78h5.39c-.23 1.22-.94 2.25-2 2.93v2.44h3.24c1.9-1.75 3-4.32 3-7.15z" fill="#4285F4"/>
              <path d="M10 20c2.7 0 4.96-.9 6.61-2.42l-3.24-2.44c-.89.6-2.04.96-3.37.96-2.6 0-4.8-1.75-5.58-4.1H1.07v2.52C2.72 17.74 6.1 20 10 20z" fill="#34A853"/>
              <path d="M4.42 11.99c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9V5.67H1.07A9.97 9.97 0 000 10c0 1.61.39 3.13 1.07 4.48l3.35-2.5z" fill="#FBBC05"/>
              <path d="M10 3.96c1.47 0 2.79.5 3.83 1.49l2.87-2.87C14.96.98 12.7 0 10 0 6.1 0 2.72 2.26 1.07 5.57l3.35 2.5C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>
        </div>
        <p class="hero-disclaimer">Free to use. No credit card required.</p>

        <!-- App Preview -->
        <div class="hero-preview">
          <div class="preview-bar">
            <span class="preview-dot red"></span>
            <span class="preview-dot yellow"></span>
            <span class="preview-dot green"></span>
            <span class="preview-url">app.triphub.com/trips</span>
          </div>
          <div class="preview-body">
            <div class="preview-sidebar">
              <div class="ps-logo">TripHub</div>
              <div class="ps-item active">My Trips</div>
              <div class="ps-item">Upcoming</div>
              <div class="ps-item">Past</div>
            </div>
            <div class="preview-content">
              <div class="pc-header">
                <div class="pc-title">My Trips</div>
                <div class="pc-new">+ New Trip</div>
              </div>
              <div class="pc-cards">
                @for (t of previewTrips(); track t.name) {
                  <div class="pc-card">
                    <div class="pcc-accent" [style.background]="t.color"></div>
                    <div class="pcc-body">
                      <div class="pcc-name">{{ t.name }}</div>
                      <div class="pcc-meta">{{ t.meta }}</div>
                      <div class="pcc-badge" [style.color]="t.color">{{ t.status }}</div>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features">
      <div class="section-inner">
        <div class="section-label">Everything you need</div>
        <h2 class="section-heading">One hub for every part of your trip</h2>
        <div class="features-grid">
          @for (f of features(); track f.title) {
            <div class="feature-card">
              <div class="feature-icon" [style.background]="f.iconBg">{{ f.icon }}</div>
              <h3 class="feature-title">{{ f.title }}</h3>
              <p class="feature-desc">{{ f.desc }}</p>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section class="how">
      <div class="section-inner">
        <div class="section-label">Simple by design</div>
        <h2 class="section-heading">Get started in 3 steps</h2>
        <div class="steps">
          @for (s of steps(); track s.title; let i = $index) {
            <div class="step">
              <div class="step-number">{{ i + 1 }}</div>
              <div class="step-body">
                <h3 class="step-title">{{ s.title }}</h3>
                <p class="step-desc">{{ s.desc }}</p>
              </div>
            </div>
          }
        </div>
      </div>
    </section>

    <!-- Final CTA -->
    <section class="cta">
      <div class="section-inner cta-inner">
        <div class="cta-globe">🌍</div>
        <h2 class="cta-heading">Ready to plan your next adventure?</h2>
        <p class="cta-sub">Join your crew and start building the perfect trip today.</p>
        <button class="btn-primary btn-large" (click)="login()">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.78h5.39c-.23 1.22-.94 2.25-2 2.93v2.44h3.24c1.9-1.75 3-4.32 3-7.15z" fill="#4285F4"/>
            <path d="M10 20c2.7 0 4.96-.9 6.61-2.42l-3.24-2.44c-.89.6-2.04.96-3.37.96-2.6 0-4.8-1.75-5.58-4.1H1.07v2.52C2.72 17.74 6.1 20 10 20z" fill="#34A853"/>
            <path d="M4.42 11.99c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9V5.67H1.07A9.97 9.97 0 000 10c0 1.61.39 3.13 1.07 4.48l3.35-2.5z" fill="#FBBC05"/>
            <path d="M10 3.96c1.47 0 2.79.5 3.83 1.49l2.87-2.87C14.96.98 12.7 0 10 0 6.1 0 2.72 2.26 1.07 5.57l3.35 2.5C5.2 5.72 7.4 3.96 10 3.96z" fill="#EA4335"/>
          </svg>
          Get started free
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="nav-logo small">
            <svg width="20" height="20" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="#2563eb"/>
              <path d="M8 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="white" stroke-width="2" stroke-linecap="round" fill="none"/>
              <circle cx="14" cy="10" r="2.5" fill="white"/>
              <path d="M10 18h8M11 20h6" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <span>TripHub</span>
        </div>
        <p class="footer-copy">© 2026 TripHub. Made with ♥ for travelers.</p>
      </div>
    </footer>
  `,
  styles: [`
    :host {
      display: block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #0f172a;
      background: #fff;
    }

    /* ───────── NAV ───────── */
    .nav {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255,255,255,0.9);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid #e2e8f0;
    }
    .nav-inner {
      max-width: 1120px;
      margin: 0 auto;
      padding: 0 24px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 700;
      font-size: 1.1rem;
      color: #0f172a;
    }
    .nav-logo {
      display: flex;
      align-items: center;
    }
    .nav-title { letter-spacing: -0.3px; }
    .nav-cta {
      background: #2563eb;
      color: white;
      border: none;
      padding: 8px 20px;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }
    .nav-cta:hover { background: #1d4ed8; }

    /* ───────── HERO ───────── */
    .hero {
      background: linear-gradient(160deg, #f0f9ff 0%, #fff 50%, #fafbff 100%);
      padding: 80px 24px 0;
      overflow: hidden;
    }
    .hero-inner {
      max-width: 860px;
      margin: 0 auto;
      text-align: center;
    }
    .hero-badge {
      display: inline-block;
      background: #eff6ff;
      color: #2563eb;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 6px 16px;
      border-radius: 100px;
      margin-bottom: 28px;
    }
    .hero-heading {
      font-size: clamp(2.6rem, 6vw, 4.2rem);
      font-weight: 800;
      line-height: 1.1;
      letter-spacing: -1.5px;
      margin: 0 0 24px;
      color: #0f172a;
    }
    .hero-heading-accent {
      background: linear-gradient(135deg, #2563eb, #7c3aed);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    .hero-sub {
      font-size: 1.15rem;
      color: #475569;
      line-height: 1.7;
      max-width: 580px;
      margin: 0 auto 36px;
    }
    .hero-actions {
      display: flex;
      justify-content: center;
      margin-bottom: 14px;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: white;
      color: #1e293b;
      border: 1.5px solid #e2e8f0;
      padding: 14px 28px;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: box-shadow 0.15s, border-color 0.15s, transform 0.1s;
    }
    .btn-primary:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      border-color: #cbd5e1;
      transform: translateY(-1px);
    }
    .btn-primary:active { transform: translateY(0); }
    .btn-large { padding: 16px 36px; font-size: 1.05rem; }
    .hero-disclaimer { font-size: 0.8rem; color: #94a3b8; margin: 0 0 64px; }

    /* ───────── APP PREVIEW ───────── */
    .hero-preview {
      max-width: 760px;
      margin: 0 auto;
      background: white;
      border-radius: 16px 16px 0 0;
      box-shadow: 0 -4px 40px rgba(37,99,235,0.1), 0 0 0 1px #e2e8f0;
      overflow: hidden;
    }
    .preview-bar {
      background: #f1f5f9;
      padding: 10px 16px;
      display: flex;
      align-items: center;
      gap: 6px;
      border-bottom: 1px solid #e2e8f0;
    }
    .preview-dot {
      width: 10px; height: 10px; border-radius: 50%;
    }
    .preview-dot.red { background: #f87171; }
    .preview-dot.yellow { background: #fbbf24; }
    .preview-dot.green { background: #34d399; }
    .preview-url {
      font-size: 0.75rem;
      color: #94a3b8;
      margin-left: 8px;
      font-family: monospace;
    }
    .preview-body {
      display: flex;
      height: 220px;
    }
    .preview-sidebar {
      width: 140px;
      background: #f8fafc;
      border-right: 1px solid #e2e8f0;
      padding: 16px 12px;
      flex-shrink: 0;
    }
    .ps-logo {
      font-size: 0.8rem;
      font-weight: 700;
      color: #2563eb;
      margin-bottom: 20px;
      padding: 0 4px;
    }
    .ps-item {
      font-size: 0.78rem;
      color: #64748b;
      padding: 6px 8px;
      border-radius: 6px;
      margin-bottom: 2px;
      cursor: default;
    }
    .ps-item.active {
      background: #eff6ff;
      color: #2563eb;
      font-weight: 600;
    }
    .preview-content {
      flex: 1;
      padding: 16px;
      overflow: hidden;
    }
    .pc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 14px;
    }
    .pc-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #0f172a;
    }
    .pc-new {
      font-size: 0.72rem;
      background: #2563eb;
      color: white;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
    }
    .pc-cards {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .pc-card {
      display: flex;
      background: #f8fafc;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .pcc-accent {
      width: 4px;
      flex-shrink: 0;
    }
    .pcc-body {
      padding: 8px 10px;
      flex: 1;
    }
    .pcc-name {
      font-size: 0.78rem;
      font-weight: 600;
      color: #1e293b;
    }
    .pcc-meta {
      font-size: 0.7rem;
      color: #94a3b8;
      margin-top: 2px;
    }
    .pcc-badge {
      font-size: 0.68rem;
      font-weight: 600;
      margin-top: 4px;
      text-transform: capitalize;
    }

    /* ───────── SECTIONS ───────── */
    .features { padding: 100px 24px; background: #fff; }
    .how { padding: 100px 24px; background: #f8fafc; }
    .section-inner {
      max-width: 1080px;
      margin: 0 auto;
    }
    .section-label {
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #2563eb;
      margin-bottom: 12px;
    }
    .section-heading {
      font-size: clamp(1.8rem, 3.5vw, 2.6rem);
      font-weight: 800;
      letter-spacing: -0.8px;
      color: #0f172a;
      margin: 0 0 56px;
      line-height: 1.2;
    }

    /* ───────── FEATURES ───────── */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
    }
    @media (max-width: 768px) {
      .features-grid { grid-template-columns: 1fr; }
    }
    .feature-card {
      padding: 32px;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      transition: box-shadow 0.2s, border-color 0.2s, transform 0.15s;
    }
    .feature-card:hover {
      box-shadow: 0 8px 32px rgba(37,99,235,0.08);
      border-color: #bfdbfe;
      transform: translateY(-3px);
    }
    .feature-icon {
      width: 52px;
      height: 52px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.4rem;
      margin-bottom: 20px;
    }
    .feature-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 0 0 10px;
      color: #0f172a;
    }
    .feature-desc {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.65;
      margin: 0;
    }

    /* ───────── HOW IT WORKS ───────── */
    .steps {
      display: flex;
      flex-direction: column;
      gap: 0;
      max-width: 620px;
    }
    .step {
      display: flex;
      gap: 28px;
      align-items: flex-start;
      padding: 28px 0;
      border-bottom: 1px solid #e2e8f0;
    }
    .step:last-child { border-bottom: none; }
    .step-number {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #2563eb;
      color: white;
      font-size: 1rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .step-title {
      font-size: 1.05rem;
      font-weight: 700;
      margin: 4px 0 8px;
      color: #0f172a;
    }
    .step-desc {
      font-size: 0.9rem;
      color: #64748b;
      line-height: 1.65;
      margin: 0;
    }

    /* ───────── CTA ───────── */
    .cta {
      padding: 100px 24px;
      background: linear-gradient(160deg, #eff6ff 0%, #faf5ff 100%);
    }
    .cta-inner { text-align: center; }
    .cta-globe { font-size: 3rem; margin-bottom: 20px; }
    .cta-heading {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      font-weight: 800;
      letter-spacing: -0.8px;
      color: #0f172a;
      margin: 0 0 16px;
    }
    .cta-sub {
      font-size: 1.1rem;
      color: #64748b;
      margin: 0 0 36px;
    }

    /* ───────── FOOTER ───────── */
    .footer {
      padding: 32px 24px;
      border-top: 1px solid #e2e8f0;
      background: #fff;
    }
    .footer-inner {
      max-width: 1080px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .footer-brand {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 0.95rem;
      color: #0f172a;
    }
    .footer-copy {
      font-size: 0.8rem;
      color: #94a3b8;
      margin: 0;
    }
  `],
})
export class LoginComponent {
  private readonly authService = inject(AuthService);

  readonly previewTrips = signal([
    { name: 'Tokyo Summer 2026', meta: 'Jul 12 – Jul 22 · 4 members', status: 'upcoming', color: '#2563eb' },
    { name: 'Patagonia Hike', meta: 'Jan 3 – Jan 14 · 2 members', status: 'active', color: '#16a34a' },
    { name: 'Lisbon Weekend', meta: 'Oct 1 – Oct 4 · 3 members', status: 'past', color: '#9333ea' },
  ]);

  readonly features = signal([
    {
      icon: '🗺️',
      iconBg: '#eff6ff',
      title: 'Destinations',
      desc: 'Pin every place you want to visit. Add notes, links, and details to each stop on your journey.',
    },
    {
      icon: '💰',
      iconBg: '#f0fdf4',
      title: 'Shared Budget',
      desc: 'Track expenses and split costs across your group. Always know exactly where the money is going.',
    },
    {
      icon: '🏨',
      iconBg: '#faf5ff',
      title: 'Accommodations',
      desc: 'Store hotels, Airbnbs, and hostels in one place. Never lose a confirmation number again.',
    },
    {
      icon: '✈️',
      iconBg: '#fff7ed',
      title: 'Transport',
      desc: 'Log flights, trains, and car rentals. Keep departure times and booking references at your fingertips.',
    },
    {
      icon: '🎒',
      iconBg: '#fef2f2',
      title: 'Packing Lists',
      desc: 'Build collaborative packing lists so everyone knows what to bring and nothing gets forgotten.',
    },
    {
      icon: '👥',
      iconBg: '#f0f9ff',
      title: 'Collaboration',
      desc: 'Invite your travel crew and plan together in real time. Everyone stays in the loop.',
    },
  ]);

  readonly steps = signal([
    {
      title: 'Sign in with Google',
      desc: 'One click and you\'re in — no passwords, no forms. Your Google account is all you need.',
    },
    {
      title: 'Create or join a trip',
      desc: 'Start a new trip or get invited to an existing one. Give it a name, dates, and a destination.',
    },
    {
      title: 'Plan together',
      desc: 'Add destinations, set a budget, organize transport, and check off your packing list as a team.',
    },
  ]);

  login(): void {
    this.authService.loginWithGoogle();
  }
}
