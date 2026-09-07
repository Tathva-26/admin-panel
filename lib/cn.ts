/** Joins class names, dropping falsy ones. Small enough not to warrant a dependency. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
