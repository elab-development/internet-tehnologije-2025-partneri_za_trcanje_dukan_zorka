import React from 'react';

interface InputProps {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
}

export default function Input({ 
  label, 
  name, 
  type = "text", 
  placeholder, 
  value, 
  onChange,
  error 
}: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`
          w-full rounded-lg border px-3 py-2 text-slate-800 placeholder:text-slate-500 shadow-sm
          focus:outline-none focus:ring-2
          dark:border-white/20 dark:bg-slate-900/70 dark:text-slate-100 dark:placeholder:text-slate-400
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
            : 'border-slate-300 bg-white/90 focus:border-blue-500 focus:ring-blue-500'}
        `}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
