/**
 * Data no fuso local como YYYY-MM-DD (para input type="date").
 * Não usar toISOString().split('T')[0] — isso é UTC e no Brasil pode vir o dia seguinte.
 */
export function localISODate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valor vindo da API (DATE ou ISO) para input type="date".
 * Se já vier como YYYY-MM-DD, usa direto (evita new Date('YYYY-MM-DD') = UTC meia-noite).
 */
export function toDateInputValue(raw: string | Date | null | undefined): string {
  if (raw == null || raw === '') return localISODate();
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) return localISODate(raw);
  const head = String(raw).split('T')[0];
  if (YMD.test(head)) return head;
  const d = new Date(raw as string);
  return Number.isNaN(d.getTime()) ? localISODate() : localISODate(d);
}

/**
 * Data civil YYYY-MM-DD vinda da API (preferir prefixo; alinha com sqlDateOnlyToYmd no backend).
 */
export function apiCivilDateKey(raw: unknown): string {
  if (raw == null || raw === '') return '';
  const head = String(raw).trim().split('T')[0];
  return YMD.test(head) ? head : '';
}
