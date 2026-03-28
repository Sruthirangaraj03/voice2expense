export function CategoryIcon({ category }: { category: string }) {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {icons[category] || icons.other}
    </svg>
  );
}

const icons: Record<string, React.ReactNode> = {
  food: (
    // Utensils
    <>
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2" />
      <path d="M7 2v20" />
      <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7" />
    </>
  ),
  transport: (
    // Bus
    <>
      <path d="M8 6v6" /><path d="M16 6v6" />
      <rect x="4" y="3" width="16" height="14" rx="2" />
      <path d="M4 11h16" /><path d="M8 21h2" /><path d="M14 21h2" />
      <path d="M6 17h12v4H6z" />
    </>
  ),
  shopping: (
    // Shopping bag
    <>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </>
  ),
  bills: (
    // Receipt
    <>
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M8 10h8" /><path d="M8 14h4" />
    </>
  ),
  health: (
    // Heart pulse
    <>
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.5.8-4.5 2.1A5.5 5.5 0 0 0 7.5 3 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
      <path d="M3.22 12H8l1.5-3 3 6 1.5-3h6.78" />
    </>
  ),
  fitness: (
    // Dumbbell
    <>
      <path d="M14.4 14.4 9.6 9.6" />
      <path d="M18.7 8.7 15.3 5.3a1 1 0 0 0-1.4 0L10 9.2a1 1 0 0 0 0 1.4l3.4 3.4a1 1 0 0 0 1.4 0l3.9-3.9a1 1 0 0 0 0-1.4Z" />
      <path d="m5.3 15.3 3.4 3.4a1 1 0 0 0 1.4 0l3.9-3.9a1 1 0 0 0 0-1.4L10.6 10a1 1 0 0 0-1.4 0L5.3 13.9a1 1 0 0 0 0 1.4Z" />
      <path d="m2.1 21.8 2.2-2.2" /><path d="m21.8 2.1-2.2 2.2" />
    </>
  ),
  entertainment: (
    // Clapperboard / Play
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" stroke="none" />
    </>
  ),
  education: (
    // Graduation cap
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1.7 2.7 3 6 3s6-1.3 6-3v-5" />
      <path d="M22 10v6" />
    </>
  ),
  grooming: (
    // Scissors
    <>
      <circle cx="6" cy="6" r="3" />
      <circle cx="6" cy="18" r="3" />
      <path d="M20 4 8.12 15.88" />
      <path d="M14.47 14.48 20 20" />
      <path d="M8.12 8.12 12 12" />
    </>
  ),
  clothing: (
    // Shirt
    <>
      <path d="M20.38 3.46 16 2 12 6 8 2 3.62 3.46a2 2 0 0 0-.76 1.96l.6 3.08A1 1 0 0 0 4.44 9.5H8v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-10h3.56a1 1 0 0 0 .98-1l.6-3.08a2 2 0 0 0-.76-1.96Z" />
    </>
  ),
  maintenance: (
    // Wrench
    <>
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
    </>
  ),
  travel: (
    // Plane
    <>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2Z" />
    </>
  ),
  family: (
    // Users
    <>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  investments: (
    // Trending up
    <>
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </>
  ),
  donations: (
    // Heart hand
    <>
      <path d="M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3.5.8-4.5 2.1A5.5 5.5 0 0 0 7.5 3 5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7Z" />
    </>
  ),
  other: (
    // More horizontal
    <>
      <circle cx="12" cy="12" r="1" fill="currentColor" />
      <circle cx="19" cy="12" r="1" fill="currentColor" />
      <circle cx="5" cy="12" r="1" fill="currentColor" />
    </>
  ),
};
