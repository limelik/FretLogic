import type { ReactNode } from 'react';

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[28px] border border-white/9 bg-gradient-to-br from-white/[0.08] to-white/[0.025] p-5 shadow-glow backdrop-blur-lg ${className}`}
    >
      {children}
    </section>
  );
}
