import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

/** Shared so an input, select and textarea cannot drift apart visually. */
const CONTROL =
  "block w-full rounded-md border border-zinc-300 bg-white px-2.5 text-sm text-zinc-900 " +
  "placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none " +
  "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-500 " +
  "aria-[invalid]:border-red-400 aria-[invalid]:focus:border-red-500";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(CONTROL, "h-9", className)} {...props} />;
}

export function Select({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(CONTROL, "h-9 pr-8", className)} {...props}>
      {children}
    </select>
  );
}

export function Textarea({
  className,
  rows = 4,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea rows={rows} className={cn(CONTROL, "py-2", className)} {...props} />
  );
}
