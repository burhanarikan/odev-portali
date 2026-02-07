import { Response } from 'express';

/**
 * JSON.stringify replacer: Prisma Decimal ve Date'leri JSON-safe hale getirir.
 * res.json() bazen Prisma Decimal nedeniyle 500 veriyor; bu replacer tüm nesneyi güvenle serialize eder.
 */
function safeJsonReplacer(_key: string, value: unknown): unknown {
  if (value == null) return value;
  if (value instanceof Date) return value.toISOString();
  // Prisma Decimal (Decimal.js / Prisma runtime)
  if (typeof value === 'object' && value !== null && typeof (value as { toString?: () => string }).toString === 'function') {
    const obj = value as { constructor?: { name?: string }; toString: () => string };
    const name = obj.constructor?.name ?? '';
    if (name === 'Decimal' || name === 'PrismaDecimal' || /Decimal/i.test(name)) {
      const s = obj.toString();
      const n = Number(s);
      return Number.isFinite(n) ? n : s;
    }
  }
  return value;
}

/** Express res üzerinden JSON gönderir; Decimal/Date güvenli serialize edilir (500 önlemek için). */
export function sendJson(res: Response, data: unknown): void {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(data, safeJsonReplacer));
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Response serialization failed' });
    }
    throw err;
  }
}
