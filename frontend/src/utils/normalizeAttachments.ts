/** Backend bazen attachments'ı JSON string döndürüyor; her zaman string[] döndür. */
export function normalizeAttachments(attachments: unknown): string[] {
  if (Array.isArray(attachments)) return attachments;
  if (typeof attachments === 'string') {
    try {
      const parsed = JSON.parse(attachments) as unknown;
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

/** Assignment (veya submission) objesindeki attachments'ı normalize et. */
export function withNormalizedAttachments<T extends { attachments?: unknown }>(item: T): T {
  return { ...item, attachments: normalizeAttachments(item?.attachments) };
}

export function withNormalizedAttachmentsList<T extends { attachments?: unknown }>(items: T[]): T[] {
  return items.map(withNormalizedAttachments);
}
