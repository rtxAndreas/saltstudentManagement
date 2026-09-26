"use client";

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { FiLoader } from "react-icons/fi";

const controlBase =
  "w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 disabled:bg-gray-50 disabled:text-gray-400";

const controlError =
  "border-red-300 focus:ring-red-500/20 focus:border-red-500";

interface FieldProps {
  label?: string;
  icon?: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  icon,
  htmlFor,
  error,
  hint,
  className = "",
  children,
}: FieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-2 text-sm font-medium text-gray-600"
        >
          {icon && <span className="text-gray-400">{icon}</span>}
          {label}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs text-red-500">{error}</p>
      ) : hint ? (
        <p className="text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    icon?: ReactNode;
    error?: string;
    hint?: string;
  }
>(({ label, icon, error, hint, className = "", id, ...props }, ref) => (
  <Field label={label} icon={icon} htmlFor={id} error={error} hint={hint}>
    <input
      id={id}
      ref={ref}
      className={`${controlBase} ${error ? controlError : ""} ${className}`}
      {...props}
    />
  </Field>
));
TextField.displayName = "TextField";

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    icon?: ReactNode;
    error?: string;
    hint?: string;
  }
>(
  (
    { label, icon, error, hint, className = "", id, children, ...props },
    ref,
  ) => (
    <Field label={label} icon={icon} htmlFor={id} error={error} hint={hint}>
      <select
        id={id}
        ref={ref}
        className={`${controlBase} bg-white ${error ? controlError : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  ),
);
SelectField.displayName = "SelectField";

export const TextareaField = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    icon?: ReactNode;
    error?: string;
    hint?: string;
  }
>(({ label, icon, error, hint, className = "", id, ...props }, ref) => (
  <Field label={label} icon={icon} htmlFor={id} error={error} hint={hint}>
    <textarea
      id={id}
      ref={ref}
      className={`${controlBase} min-h-24 resize-y ${error ? controlError : ""} ${className}`}
      {...props}
    />
  </Field>
));
TextareaField.displayName = "TextareaField";

interface SubmitButtonProps {
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "submit" | "button";
}

export function SubmitButton({
  loading,
  loadingLabel = "Enregistrement...",
  children,
  className = "",
  disabled,
  onClick,
  type = "submit",
}: SubmitButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={loading || disabled}
      className={`flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading && <FiLoader className="animate-spin" />}
      {loading ? loadingLabel : children}
    </button>
  );
}

export function CancelButton({
  onClick,
  children = "Annuler",
}: {
  onClick: () => void;
  children?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
    >
      {children}
    </button>
  );
}
