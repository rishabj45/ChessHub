// frontend/src/utils/helpers.ts
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US');
}

export function compareDesc(a: any, b: any): number {
  if (a < b) return 1;
  if (a > b) return -1;
  return 0;
}
