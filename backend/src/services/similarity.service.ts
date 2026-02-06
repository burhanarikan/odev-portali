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

  /** İki token eşleşir: aynı kelime veya aynı baş harf (Türkçe duyarlı). */
  private tokenMatches(a: string, b: string): boolean {
    if (a === b) return true;
    if (!a.length || !b.length) return false;
    const firstA = a.charAt(0).toLowerCase();
    const firstB = b.charAt(0).toLowerCase();
    return firstA === firstB;
  }

  /**
   * Kullanıcı metnindeki her kelime için: mevcut ödevde en az bir kelime eşleşiyor mu (tam veya baş harf)?
   * Skor = eşleşen kullanıcı kelimesi sayısı / kullanıcı kelimesi sayısı.
   * Yazdıkça sadece en az bir kelimesi eşleşen ödevler kalır (skor > 0).
   */
  private wordMatchScore(userTokens: string[], existingTokens: string[]): number {
    if (userTokens.length === 0) return 0;
    const existingSet = existingTokens;
    let matched = 0;
    for (const u of userTokens) {
      const hasMatch = existingSet.some((t) => this.tokenMatches(u, t));
      if (hasMatch) matched += 1;
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

      // Başlık + açıklamadaki tüm kelimeler; en az bir kelime tam veya baş harf eşleşirse skor > 0
      const score = this.wordMatchScore(newTokens, existingTokens);

      if (score > 0) {
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
