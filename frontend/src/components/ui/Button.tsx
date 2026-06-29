import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'outline' | 'danger';
  icon?: ReactNode;
};

const variants = {
  primary:
    'bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 text-slate-950 shadow-glow hover:brightness-105',
  ghost:
    'bg-white/6 text-white hover:bg-white/10 border border-white/10',
  outline:
    'border border-cyan-400/24 bg-cyan-400/[0.06] text-cyan-100 hover:bg-cyan-400/[0.1]',
  danger:
    'border border-rose-400/35 bg-rose-400/10 text-rose-100 hover:bg-rose-400/16',
};

export function Button({ variant = 'primary', className = '', icon, children, ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold tracking-wide transition duration-300 disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}
