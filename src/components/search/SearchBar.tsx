"use client";

import { LoaderCircle, Search, X } from "lucide-react";
import { useEffect, useRef, type FormEvent } from "react";

import { cn } from "@/lib/utils/cn";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onClear: () => void;
  /** Shows a small spinner inside the bar. */
  loading?: boolean;
  maxLength?: number;
  /** Focus the input once on mount. */
  autoFocus?: boolean;
  className?: string;
}

/** Controlled input only: it knows nothing about providers or requests. */
export function SearchBar({
  value,
  onChange,
  onSubmit,
  onClear,
  loading = false,
  maxLength,
  autoFocus = false,
  className,
}: SearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        "flex h-12 w-full min-w-0 items-center gap-3 rounded-lg border border-border bg-surface px-4 transition-colors focus-within:border-secondary",
        className,
      )}
    >
      <Search aria-hidden="true" className="size-4 shrink-0 text-muted" />

      <label htmlFor="search-input" className="sr-only">
        Search music
      </label>
      <input
        ref={inputRef}
        id="search-input"
        type="text"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        maxLength={maxLength}
        placeholder="Search songs and artists"
        onChange={(event) => onChange(event.target.value)}
        className="h-full min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted md:text-sm"
      />

      {loading && (
        <LoaderCircle
          aria-hidden="true"
          className="size-4 shrink-0 animate-spin text-muted motion-reduce:animate-none"
        />
      )}

      {value !== "" && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="-mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-full text-secondary transition-colors hover:bg-surface-elevated hover:text-foreground"
        >
          <X aria-hidden="true" className="size-4" />
        </button>
      )}
    </form>
  );
}
