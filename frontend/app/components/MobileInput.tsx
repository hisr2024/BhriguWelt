'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState, forwardRef, useId } from 'react';
import {
  X, Eye, EyeOff, Calendar, Clock,
  ChevronDown, Search, AlertCircle
} from 'lucide-react';

// Base input props
interface MobileInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'password' | 'tel' | 'number' | 'search';
  placeholder?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
  disabled?: boolean;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  className?: string;
}

// Floating label input component
export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  function MobileInput(
    {
      label,
      value,
      onChange,
      type = 'text',
      placeholder,
      error,
      helperText,
      icon,
      disabled = false,
      required = false,
      maxLength,
      autoComplete,
      className = '',
    },
    ref
  ) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const inputId = useId();

    const isFloating = isFocused || value.length > 0;
    const actualType = type === 'password' && showPassword ? 'text' : type;

    return (
      <div className={`relative ${className}`}>
        {/* Input container */}
        <motion.div
          className={`relative rounded-2xl transition-all duration-300 ${
            error
              ? 'ring-2 ring-red-500/50'
              : isFocused
              ? 'ring-2 ring-genz-electric-blue/50'
              : ''
          }`}
          animate={{
            boxShadow: isFocused
              ? '0 0 20px rgba(0, 217, 255, 0.15)'
              : '0 0 0 rgba(0, 0, 0, 0)',
          }}
        >
          {/* Left icon */}
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 z-10">
              {icon}
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            autoComplete={autoComplete}
            placeholder={isFloating ? placeholder : ''}
            className={`
              w-full bg-dark-surface/50 backdrop-blur-xl border-2 border-white/20
              rounded-2xl text-white placeholder-white/30
              transition-all duration-300 outline-none
              disabled:opacity-50 disabled:cursor-not-allowed
              touch-manipulation text-base
              ${icon ? 'pl-12' : 'pl-4'}
              ${type === 'password' ? 'pr-12' : 'pr-4'}
              ${isFloating ? 'pt-6 pb-2' : 'py-4'}
              ${error ? 'border-red-500/50' : isFocused ? 'border-genz-electric-blue' : 'border-white/20'}
            `}
            style={{ fontSize: '16px' }} // Prevents iOS zoom
          />

          {/* Floating label */}
          <motion.label
            htmlFor={inputId}
            className={`absolute left-0 pointer-events-none transition-all duration-200 ${
              icon ? 'left-12' : 'left-4'
            } ${error ? 'text-red-400' : isFocused ? 'text-genz-electric-blue' : 'text-white/50'}`}
            animate={{
              top: isFloating ? '8px' : '50%',
              y: isFloating ? 0 : '-50%',
              fontSize: isFloating ? '12px' : '16px',
            }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </motion.label>

          {/* Password toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors touch-manipulation p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}

          {/* Character count */}
          {maxLength && (
            <span className="absolute right-4 bottom-2 text-xs text-white/30">
              {value.length}/{maxLength}
            </span>
          )}
        </motion.div>

        {/* Error or helper text */}
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className={`mt-2 text-sm flex items-center gap-1 ${
                error ? 'text-red-400' : 'text-white/50'
              }`}
            >
              {error && <AlertCircle className="w-4 h-4" />}
              {error || helperText}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

// Date picker input
interface MobileDateInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  min?: string;
  max?: string;
  className?: string;
}

export function MobileDateInput({
  label,
  value,
  onChange,
  error,
  min,
  max,
  className = '',
}: MobileDateInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`relative rounded-2xl transition-all duration-300 ${
          error
            ? 'ring-2 ring-red-500/50'
            : isFocused
            ? 'ring-2 ring-genz-electric-blue/50'
            : ''
        }`}
      >
        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10" />

        <input
          id={inputId}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          min={min}
          max={max}
          className={`
            w-full bg-dark-surface/50 backdrop-blur-xl border-2 border-white/20
            rounded-2xl text-white pl-12 pr-4 pt-6 pb-2
            transition-all duration-300 outline-none touch-manipulation
            ${error ? 'border-red-500/50' : isFocused ? 'border-genz-electric-blue' : 'border-white/20'}
          `}
          style={{ fontSize: '16px' }}
        />

        <label
          htmlFor={inputId}
          className={`absolute left-12 top-2 text-xs pointer-events-none ${
            error ? 'text-red-400' : isFocused ? 'text-genz-electric-blue' : 'text-white/50'
          }`}
        >
          {label}
        </label>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400 flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Time picker input
interface MobileTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export function MobileTimeInput({
  label,
  value,
  onChange,
  error,
  className = '',
}: MobileTimeInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = useId();

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`relative rounded-2xl transition-all duration-300 ${
          error
            ? 'ring-2 ring-red-500/50'
            : isFocused
            ? 'ring-2 ring-genz-electric-blue/50'
            : ''
        }`}
      >
        <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 z-10" />

        <input
          id={inputId}
          type="time"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full bg-dark-surface/50 backdrop-blur-xl border-2 border-white/20
            rounded-2xl text-white pl-12 pr-4 pt-6 pb-2
            transition-all duration-300 outline-none touch-manipulation
            ${error ? 'border-red-500/50' : isFocused ? 'border-genz-electric-blue' : 'border-white/20'}
          `}
          style={{ fontSize: '16px' }}
        />

        <label
          htmlFor={inputId}
          className={`absolute left-12 top-2 text-xs pointer-events-none ${
            error ? 'text-red-400' : isFocused ? 'text-genz-electric-blue' : 'text-white/50'
          }`}
        >
          {label}
        </label>
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400 flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Select input
interface MobileSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
  placeholder?: string;
  className?: string;
}

export function MobileSelect({
  label,
  value,
  onChange,
  options,
  error,
  placeholder = 'Select an option',
  className = '',
}: MobileSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const selectId = useId();

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`relative rounded-2xl transition-all duration-300 ${
          error
            ? 'ring-2 ring-red-500/50'
            : isFocused
            ? 'ring-2 ring-genz-electric-blue/50'
            : ''
        }`}
      >
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={`
            w-full bg-dark-surface/50 backdrop-blur-xl border-2 border-white/20
            rounded-2xl text-white pl-4 pr-10 pt-6 pb-2 appearance-none
            transition-all duration-300 outline-none touch-manipulation cursor-pointer
            ${error ? 'border-red-500/50' : isFocused ? 'border-genz-electric-blue' : 'border-white/20'}
            ${!value ? 'text-white/50' : ''}
          `}
          style={{ fontSize: '16px' }}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <label
          htmlFor={selectId}
          className={`absolute left-4 top-2 text-xs pointer-events-none ${
            error ? 'text-red-400' : isFocused ? 'text-genz-electric-blue' : 'text-white/50'
          }`}
        >
          {label}
        </label>

        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400 flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Search input
interface MobileSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export function MobileSearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
  className = '',
}: MobileSearchInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <motion.div
      className={`relative ${className}`}
      animate={{
        boxShadow: isFocused
          ? '0 0 20px rgba(0, 217, 255, 0.15)'
          : '0 0 0 rgba(0, 0, 0, 0)',
      }}
    >
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />

      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className={`
          w-full bg-dark-surface/50 backdrop-blur-xl border-2
          rounded-full text-white placeholder-white/40 pl-12 pr-12 py-3
          transition-all duration-300 outline-none touch-manipulation
          ${isFocused ? 'border-genz-electric-blue' : 'border-white/20'}
        `}
        style={{ fontSize: '16px' }}
      />

      <AnimatePresence>
        {value && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => {
              onChange('');
              onClear?.();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors touch-manipulation"
            type="button"
          >
            <X className="w-4 h-4 text-white/60" />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Textarea
interface MobileTextareaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  maxLength?: number;
  rows?: number;
  className?: string;
}

export function MobileTextarea({
  label,
  value,
  onChange,
  placeholder,
  error,
  maxLength,
  rows = 4,
  className = '',
}: MobileTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const textareaId = useId();
  const isFloating = isFocused || value.length > 0;

  return (
    <div className={`relative ${className}`}>
      <motion.div
        className={`relative rounded-2xl transition-all duration-300 ${
          error
            ? 'ring-2 ring-red-500/50'
            : isFocused
            ? 'ring-2 ring-genz-electric-blue/50'
            : ''
        }`}
      >
        <textarea
          id={textareaId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={isFloating ? placeholder : ''}
          maxLength={maxLength}
          rows={rows}
          className={`
            w-full bg-dark-surface/50 backdrop-blur-xl border-2 border-white/20
            rounded-2xl text-white placeholder-white/30 px-4 pt-6 pb-2
            transition-all duration-300 outline-none touch-manipulation resize-none
            ${error ? 'border-red-500/50' : isFocused ? 'border-genz-electric-blue' : 'border-white/20'}
          `}
          style={{ fontSize: '16px' }}
        />

        <motion.label
          htmlFor={textareaId}
          className={`absolute left-4 pointer-events-none transition-all duration-200 ${
            error ? 'text-red-400' : isFocused ? 'text-genz-electric-blue' : 'text-white/50'
          }`}
          animate={{
            top: isFloating ? '8px' : '16px',
            fontSize: isFloating ? '12px' : '16px',
          }}
        >
          {label}
        </motion.label>

        {maxLength && (
          <span className="absolute right-4 bottom-2 text-xs text-white/30">
            {value.length}/{maxLength}
          </span>
        )}
      </motion.div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-400 flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.p>
      )}
    </div>
  );
}

// Toggle switch
interface MobileToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function MobileToggle({
  label,
  description,
  checked,
  onChange,
  className = '',
}: MobileToggleProps) {
  return (
    <button
      type="button"
      onClick={() => {
        if (navigator.vibrate) navigator.vibrate(5);
        onChange(!checked);
      }}
      className={`flex items-center justify-between w-full p-4 rounded-2xl bg-dark-surface/50 backdrop-blur-xl border-2 border-white/10 touch-manipulation transition-all duration-300 hover:bg-white/5 ${className}`}
    >
      <div className="text-left">
        <p className="font-medium text-white">{label}</p>
        {description && <p className="text-sm text-white/50 mt-0.5">{description}</p>}
      </div>

      <motion.div
        className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${
          checked ? 'bg-genz-electric-blue' : 'bg-white/20'
        }`}
      >
        <motion.div
          className="absolute top-1 w-6 h-6 rounded-full bg-white shadow-lg"
          animate={{ left: checked ? '28px' : '4px' }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.div>
    </button>
  );
}
