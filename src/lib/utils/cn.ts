export type ClassValue = string | false | null | undefined;

/** Joins class names, skipping falsy values. No Tailwind conflict merging. */
export function cn(...values: ClassValue[]): string {
  const classes: string[] = [];

  for (const value of values) {
    if (value) classes.push(value);
  }

  return classes.join(" ");
}
