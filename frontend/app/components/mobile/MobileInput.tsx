'use client';

import { forwardRef, useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Check, AlertCircle, Info, ChevronDown, X, Search, Calendar, Clock } from 'lucide-react';

// Base input props
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: string;
  hint?: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outline' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      icon,
      rightIcon,
      variant = 'default',
      inputSize = 'md',
      fullWidth = true,
      className = '',
      type = 'text',
      disabled,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = useId();

    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

    const sizes = {
      sm: 'min-h-[40px] text-sm py-2 px-3',
      md: 'min-h-touch text-base py-3 px-4',
      lg: 'min-h-touch-lg text-lg py-4 px-5',
    };

    const variants = {
      default: `
        bg-dark-surface/50 border border-white/20
        focus:border-genz-electric-blue focus:ring-2 focus:ring-genz-electric-blue/20
      `,
      filled: `
        bg-white/5 border-transparent
        focus:bg-white/10 focus:border-genz-electric-blue
      `,
      outline: `
        bg-transparent border-2 border-white/30
        focus:border-genz-electric-blue
      `,
      ghost: `
        bg-transparent border-transparent
        focus:bg-white/5 focus:border-white/20
      `,
    };

    const stateStyles = error
      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
      : success
        ? 'border-green-400 focus:border-green-400 focus:ring-green-400/20'
        : '';

    return (
      <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`
              block text-sm font-medium mb-2 transition-colors
              ${isFocused ? 'text-genz-electric-blue' : 'text-white/70'}
              ${error ? 'text-red-400' : ''}
              ${success ? 'text-green-400' : ''}
            `}
          >
            {label}
          </label>
        )}

        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none">
              {icon}
            </div>
          )}

          <input
            ref={ref}
            id={inputId}
            type={inputType}
            disabled={disabled}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={`
              w-full rounded-xl text-white placeholder-white/40
              transition-all duration-200
              touch-manipulation
              outline-none
              ${sizes[inputSize]}
              ${variants[variant]}
              ${stateStyles}
              ${icon ? 'pl-12' : ''}
              ${rightIcon || isPassword ? 'pr-12' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            {...props}
          />

          {(rightIcon || isPassword || error || success) && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isPassword && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 rounded-lg hover:bg-white/10 transition-colors text-white/60"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              )}
              {error && <AlertCircle className="w-5 h-5 text-red-400" />}
              {success && <Check className="w-5 h-5 text-green-400" />}
              {rightIcon && !error && !success && rightIcon}
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {(error || success || hint) && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`
                text-sm mt-2 flex items-center gap-1
                ${error ? 'text-red-400' : success ? 'text-green-400' : 'text-white/50'}
              `}
            >
              {hint && !error && !success && <Info className="w-3 h-3" />}
              {error || success || hint}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

// Textarea component
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ label, error, hint, maxLength, showCount = false, className = '', value, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = useId();
    const currentLength = String(value || '').length;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label
            htmlFor={inputId}
            className={`
              block text-sm font-medium mb-2 transition-colors
              ${isFocused ? 'text-genz-electric-blue' : 'text-white/70'}
              ${error ? 'text-red-400' : ''}
            `}
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          value={value}
          maxLength={maxLength}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full min-h-[120px] rounded-xl text-white placeholder-white/40
            bg-dark-surface/50 border border-white/20
            focus:border-genz-electric-blue focus:ring-2 focus:ring-genz-electric-blue/20
            transition-all duration-200 touch-manipulation outline-none
            resize-y py-3 px-4 text-base
            ${error ? 'border-red-400 focus:border-red-400' : ''}
          `}
          {...props}
        />

        <div className="flex items-center justify-between mt-2">
          {(error || hint) && (
            <p className={`text-sm ${error ? 'text-red-400' : 'text-white/50'}`}>
              {error || hint}
            </p>
          )}
          {showCount && maxLength && (
            <p className={`text-sm ml-auto ${currentLength >= maxLength ? 'text-red-400' : 'text-white/50'}`}>
              {currentLength}/{maxLength}
            </p>
          )}
        </div>
      </div>
    );
  }
);

MobileTextarea.displayName = 'MobileTextarea';

// Search Input
interface MobileSearchInputProps extends Omit<MobileInputProps, 'icon'> {
  onClear?: () => void;
  showClear?: boolean;
}

export function MobileSearchInput({
  value,
  onChange,
  onClear,
  showClear = true,
  placeholder = 'Search...',
  ...props
}: MobileSearchInputProps) {
  const hasValue = Boolean(value);

  return (
    <MobileInput
      type="search"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      icon={<Search className="w-5 h-5" />}
      rightIcon={
        hasValue && showClear ? (
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        ) : undefined
      }
      variant="filled"
      {...props}
    />
  );
}

// Select/Dropdown
interface MobileSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface MobileSelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: MobileSelectOption[];
  placeholder?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export function MobileSelect({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  disabled,
  className = '',
}: MobileSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputId = useId();
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium mb-2 text-white/70">
          {label}
        </label>
      )}

      <button
        id={inputId}
        type="button"
        onClick={() => !disabled && setIsOpen(true)}
        disabled={disabled}
        className={`
          w-full min-h-touch rounded-xl text-left
          bg-dark-surface/50 border border-white/20
          transition-all duration-200
          flex items-center justify-between
          px-4 py-3
          ${isOpen ? 'border-genz-electric-blue ring-2 ring-genz-electric-blue/20' : ''}
          ${error ? 'border-red-400' : ''}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <span className={selectedOption ? 'text-white' : 'text-white/40'}>
          {selectedOption?.label || placeholder}
        </span>
        <ChevronDown className={`w-5 h-5 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-modal"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 z-modal
                bg-dark-elevated border border-white/10 rounded-xl
                shadow-mobile-lg overflow-hidden max-h-60 overflow-y-auto"
            >
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange?.(option.value);
                    setIsOpen(false);
                  }}
                  disabled={option.disabled}
                  className={`
                    w-full btn-touch text-left px-4
                    transition-colors
                    ${option.value === value
                      ? 'bg-genz-electric-blue/10 text-genz-electric-blue'
                      : 'text-white hover:bg-white/5'
                    }
                    ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  {option.label}
                  {option.value === value && (
                    <Check className="w-4 h-4 ml-auto inline" />
                  )}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {error && (
        <p className="text-sm text-red-400 mt-2">{error}</p>
      )}
    </div>
  );
}

// Date/Time picker wrapper
interface MobileDateInputProps extends Omit<MobileInputProps, 'type' | 'icon'> {
  dateType?: 'date' | 'time' | 'datetime-local';
}

export function MobileDateInput({ dateType = 'date', ...props }: MobileDateInputProps) {
  const iconMap = {
    date: <Calendar className="w-5 h-5" />,
    time: <Clock className="w-5 h-5" />,
    'datetime-local': <Calendar className="w-5 h-5" />,
  };

  return (
    <MobileInput
      type={dateType}
      icon={iconMap[dateType]}
      {...props}
    />
  );
}

export default MobileInput;
