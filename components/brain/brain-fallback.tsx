export function BrainFallback({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`brain-fallback${compact ? " compact" : ""}`} role="img" aria-label="Representación visual de un cerebro humano">
      <svg viewBox="0 0 420 300" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="brain-fallback-gradient" x1="40" y1="25" x2="380" y2="275" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F3B9C9" />
            <stop offset="0.5" stopColor="#6EC2BD" />
            <stop offset="1" stopColor="#F4B827" />
          </linearGradient>
          <filter id="brain-fallback-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        <path d="M203 53C169 18 104 22 79 65c-28-1-50 23-46 51-23 23-15 57 13 69-3 33 27 57 58 49 21 27 61 27 86 6 24 22 66 20 86-7 33 8 63-20 58-52 28-16 36-53 13-76 4-31-18-59-47-59-25-42-91-43-127-3Z" fill="#151a20" stroke="url(#brain-fallback-gradient)" strokeWidth="4" filter="url(#brain-fallback-glow)" />
        <path d="M210 60c-19 24-21 53-10 84 8 23 8 48-7 75M184 58c-23 5-36 22-36 45 1 18 11 29 27 38M122 82c-13 14-13 34-1 47 10 10 25 12 38 5M77 127c17 1 28 11 32 27 3 17-6 29-20 35M147 163c-16 10-18 29-6 42 9 10 23 13 37 8M234 60c23 3 37 19 38 42 1 17-9 30-25 38M298 83c13 14 13 33 1 46-10 10-25 12-38 5M343 127c-17 1-28 11-32 27-3 17 6 29 20 35M272 163c16 10 18 29 6 42-9 10-23 13-37 8" stroke="url(#brain-fallback-gradient)" strokeWidth="3" strokeLinecap="round" opacity=".9" />
        <path d="M202 87c-19 12-24 31-14 47 10 16 29 18 43 6 14-12 14-31 0-45M204 142c-15 13-13 34 3 44 16 10 34 2 39-14" stroke="#FAFAFA" strokeOpacity=".78" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M143 113c26 12 45 18 63 18 20 0 40-6 70-20" stroke="#6EC2BD" strokeOpacity=".75" strokeWidth="2" strokeDasharray="3 8" />
        <circle cx="130" cy="152" r="6" fill="#F4B827" />
        <circle cx="285" cy="111" r="5" fill="#F3B9C9" />
        <circle cx="228" cy="193" r="6" fill="#6EC2BD" />
      </svg>
    </div>
  );
}
