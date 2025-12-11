import React from 'react';
import { Loader2 } from 'lucide-react';

// --- Glass Card ---
// Updated to forward ref for html2canvas
export const GlassCard = React.forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(({ children, className = '' }, ref) => (
  <div ref={ref} className={`glass-card rounded-3xl p-6 ${className} shadow-2xl`}>
    {children}
  </div>
));

// --- Primary Neon Button ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "w-full py-4 rounded-xl font-bold text-lg tracking-wide transition-all duration-300 transform active:scale-95 flex items-center justify-center gap-2 uppercase";
  
  const variants = {
    primary: "bg-gradient-to-b from-blood-500 to-blood-700 text-white shadow-[0_0_20px_rgba(204,0,0,0.4)] hover:shadow-[0_0_30px_rgba(204,0,0,0.6)] hover:brightness-110 border-t border-white/20",
    secondary: "glass-card text-white hover:bg-white/10 border border-white/20",
    outline: "bg-transparent border-2 border-white/30 text-white hover:bg-white/10",
    danger: "bg-blood-600 text-white animate-pulse"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className} ${isLoading ? 'opacity-80 cursor-wait' : ''}`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <Loader2 className="animate-spin" /> : children}
    </button>
  );
};

// --- Input Field ---
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="mb-4 w-full">
    {label && <label className="block text-sm font-medium text-gray-300 mb-1 ml-1">{label}</label>}
    <input 
      className={`w-full bg-black/40 border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blood-500 focus:shadow-[0_0_10px_rgba(255,0,50,0.3)] transition-all placeholder:text-gray-600 ${className}`}
      {...props}
    />
  </div>
);

// --- Select Field ---
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: string[];
}

export const Select: React.FC<SelectProps> = ({ label, options, className = '', ...props }) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 ml-1">{label}</label>}
    <div className="relative">
      <select 
        className={`w-full appearance-none bg-black/40 border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blood-500 focus:shadow-[0_0_10px_rgba(255,0,50,0.3)] transition-all cursor-pointer ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt} value={opt} className="bg-gray-900 text-white">{opt}</option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  </div>
);

// --- Text Area ---
export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = ({ className = '', ...props }) => (
  <textarea 
    className={`w-full bg-black/40 border border-white/20 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-blood-500 focus:shadow-[0_0_10px_rgba(255,0,50,0.3)] transition-all placeholder:text-gray-600 resize-none min-h-[120px] ${className}`}
    {...props}
  />
);

// --- Typography ---
export const Title: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <h1 className={`font-display text-5xl md:text-7xl uppercase text-white drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] leading-[0.9] text-center ${className}`}>
    {children}
  </h1>
);

export const Subtitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-body text-gray-300 text-center text-sm md:text-base tracking-wide ${className}`}>
    {children}
  </p>
);