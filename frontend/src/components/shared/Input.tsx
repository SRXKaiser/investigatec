import type { ChangeEvent } from 'react';

interface InputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  error?: string;
  className?: string;
}

const Input = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  error,
  className = '',
}: InputProps) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <label htmlFor={id} className={`flex flex-col w-72 ${className}`}>
      <span className="text-sm self-start font-cuerpo font-semibold">
        {label}
      </span>
      <input
        id={id}
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        className="bg-[var(--bg)] font-sub-pixel text-[var(--rojo)]
                   px-4 rounded-xl w-[250px]
                   focus:outline-none focus:ring-2 focus:ring-[var(--rosita)]/50
                   placeholder:text-[var(--cafe)]/50
                   transition border-2 border-[var(--negro)] border-r-5 border-b-5"
      />
      {error && (
        <span className="text-xs text-[var(--rosita)] self-end mt-1">
          {error}
        </span>
      )}
    </label>
  );
};

export default Input;