/**
 * Utilitaire sécurisé d'export CSV conforme RFC 4180 avec protection contre l'injection de formules
 * (CSV / Formula Injection).
 * 
 * Toute cellule débutant par '=', '+', '-', '@' ou tabulation est préfixée par une apostrophe (')
 * pour empêcher les tableurs (Excel, Calc, Google Sheets) d'exécuter des formules arbitraires.
 */

export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  let str = String(value);

  // Protection contre l'injection de formule dans les tableurs
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Échappement des guillemets doubles selon RFC 4180
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function exportToCsv(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][]
): void {
  const headerLine = headers.map((h) => sanitizeCsvCell(h)).join(',');
  const rowLines = rows.map((row) => row.map((cell) => sanitizeCsvCell(cell)).join(','));

  const csvContent = [headerLine, ...rowLines].join('\r\n');

  // Ajout du BOM UTF-8 (\uFEFF) pour compatibilité parfaite avec Excel Windows
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
