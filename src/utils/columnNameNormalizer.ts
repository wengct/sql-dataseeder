export function normalizeColumnName(value: string): string {
  return value.normalize('NFKC').toLocaleLowerCase('en-US');
}

