export function BrainCardMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 220 150" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="brain-card-gradient" x1="22" y1="17" x2="198" y2="133" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3B9C9" />
          <stop offset="0.52" stopColor="#6EC2BD" />
          <stop offset="1" stopColor="#F4B827" />
        </linearGradient>
      </defs>
      <path d="M104 25c-16-18-47-17-62 3-14-1-27 11-26 27-11 11-8 31 6 38-2 17 14 30 30 27 10 13 31 13 43 3 11 11 32 10 42-3 17 4 32-10 30-27 14-8 17-27 6-38 1-16-12-28-26-27-15-20-46-21-63-3Z" fill="url(#brain-card-gradient)" fillOpacity=".18" stroke="url(#brain-card-gradient)" strokeWidth="2.5" />
      <path d="M108 30c-8 14-9 30-4 45 4 13 4 25-3 39M94 29c-11 3-17 11-18 22 0 9 5 14 12 19M64 44c-6 7-6 17 0 23 5 5 12 6 18 3M46 69c8 0 13 5 15 13 2 8-2 14-9 17M79 84c-7 5-8 14-2 21 4 5 11 7 17 5M116 31c12 1 19 9 20 21 1 8-3 15-10 19M157 45c6 7 6 16 0 22-5 5-12 6-18 3M173 69c-8 0-13 5-15 13-2 8 2 14 9 17M140 84c7 5 8 14 2 21-4 5-11 7-17 5" stroke="url(#brain-card-gradient)" strokeWidth="2" strokeLinecap="round" opacity=".92" />
      <path d="M103 47c-10 6-13 15-8 23 5 8 15 9 22 3 7-6 7-16 0-23M104 75c-8 7-7 17 1 22 8 5 17 1 19-7" stroke="#FAFAFA" strokeOpacity=".72" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="68" cy="76" r="3" fill="#F4B827" />
      <circle cx="151" cy="61" r="2.5" fill="#F3B9C9" />
      <circle cx="120" cy="102" r="3" fill="#6EC2BD" />
    </svg>
  );
}
