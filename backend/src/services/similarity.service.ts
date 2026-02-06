import { prisma } from '../config/database';

export interface SimilarAssignment {
  id: string;
  title: string;
  description: string | null;
  teacherName: string;
  levelName: string;
  weekNumber: number;
  similarityScore: number;
  /** Örneğin: "Tüm seviye" veya "A Sınıfı" veya "Öğrenci: Ayşe, Mehmet" */
  targetsSummary: string;
}

export class SimilarityService {
  private stopWords = new Set([
    'bir', 've', 'ile', 'için', 'bu', 'şu', 'o', 'de', 'da', 'den', 'dan',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'to', 'in', 'for', 'on', 'with', 'as', 'by', 'at', 'from'
  ]);

  /** Tüm kelimeleri al; en az 1 karakter (baş harf eşleşmesi için). Stop word'ler çıkarılır. */
  private tokenize(text: string): string[] {
    const cleaned = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token =>
        token.length >= 1 && !this.stopWords.has(token)
      );
    return cleaned;
  }

  /**
   * İki token eşleşir: tam aynı kelime veya biri diğerinin başı (prefix).
   * Örn: "ö" / "ör" / "örn" → "örnek" ile eşleşir; "örna" → "örnek" ile eşleşmez.
   */
  private tokenMatches(a: string, b: string): boolean {
    if (a === b) return true;
    if (!a.length || !b.length) return false;
    return b.startsWith(a) || a.startsWith(b);
  }

  /**
   * Skor: kullanıcı kelimelerinden kaçı mevcut ödevde (tam veya prefix) eşleşiyor.
   */
  private wordMatchScore(userTokens: string[], existingTokens: string[]): number {
    if (userTokens.length === 0) return 0;
    let matched = 0;
    for (const u of userTokens) {
      if (existingTokens.some((t) => this.tokenMatches(u, t))) matched += 1;
    }
    return matched / userTokens.length;
  }

  async findSimilarAssignments(
    title: string,
    description: string,
    _levelId?: string,
    _weekNumber?: number
  ): Promise<SimilarAssignment[]> {
    const newText = `${title || ''} ${description || ''}`.trim();
    const newTokens = this.tokenize(newText);

    const existingAssignments = await prisma.assignment.findMany({
      where: {
        isDraft: false
      },
      include: {
        teacher: {
          include: {
            user: true
          }
        },
        level: true,
        targets: {
          include: {
            class: { select: { name: true } },
            student: { include: { user: { select: { name: true } } } }
          }
        }
      }
    });

    const similar: SimilarAssignment[] = [];

    for (const assignment of existingAssignments) {
      const existingText = `${assignment.title} ${assignment.description || ''}`.trim();
      const existingTokens = this.tokenize(existingText);

      // Tam veya prefix eşleşme: "ö"/"ör"/"örn" → "örnek" çıkar; "örna" → eşleşme bozulur, çıkmaz
      const score = this.wordMatchScore(newTokens, existingTokens);
      if (score <= 0) continue;

      const targetsSummary = this.formatTargetsSummary(assignment.targets);
      similar.push({
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        teacherName: assignment.teacher.user.name,
        levelName: assignment.level.name,
        weekNumber: assignment.weekNumber,
        similarityScore: Math.round(score * 100 * 100) / 100,
        targetsSummary
      });
    }

    return similar.sort((a, b) => b.similarityScore - a.similarityScore);
  }

  private formatTargetsSummary(
    targets: Array<{ targetType: string; class?: { name: string } | null; student?: { user: { name: string } } | null }>
  ): string {
    if (!targets || targets.length === 0) return 'Tüm seviye';
    const classes = targets.filter(t => t.class).map(t => t.class!.name);
    const students = targets.filter(t => t.student).map(t => t.student!.user.name);
    const parts: string[] = [];
    if (classes.length) parts.push(classes.join(', ') + ' sınıfı');
    if (students.length) parts.push(students.length <= 3 ? 'Öğrenci: ' + students.join(', ') : `${students.length} öğrenci`);
    return parts.length ? parts.join(' · ') : 'Tüm seviye';
  }
}
