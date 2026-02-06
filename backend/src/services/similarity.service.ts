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

  private tokenize(text: string): string[] {
    const cleaned = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(token => 
        token.length > 2 && !this.stopWords.has(token)
      );
    return cleaned;
  }

  private jaccardSimilarity(tokens1: string[], tokens2: string[]): number {
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return union.size === 0 ? 0 : intersection.size / union.size;
  }

  private cosineSimilarity(tokens1: string[], tokens2: string[]): number {
    const freq1 = new Map<string, number>();
    const freq2 = new Map<string, number>();
    
    tokens1.forEach(t => freq1.set(t, (freq1.get(t) || 0) + 1));
    tokens2.forEach(t => freq2.set(t, (freq2.get(t) || 0) + 1));
    
    const allTokens = new Set([...tokens1, ...tokens2]);
    
    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;
    
    allTokens.forEach(token => {
      const v1 = freq1.get(token) || 0;
      const v2 = freq2.get(token) || 0;
      dotProduct += v1 * v2;
      mag1 += v1 * v1;
      mag2 += v2 * v2;
    });
    
    return (mag1 === 0 || mag2 === 0) 
      ? 0 
      : dotProduct / (Math.sqrt(mag1) * Math.sqrt(mag2));
  }

  async findSimilarAssignments(
    title: string,
    description: string,
    levelId: string,
    weekNumber: number,
    threshold = 0.7
  ): Promise<SimilarAssignment[]> {
    const newText = `${title} ${description || ''}`;
    const newTokens = this.tokenize(newText);

    const existingAssignments = await prisma.assignment.findMany({
      where: {
        levelId,
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
      const existingText = `${assignment.title} ${assignment.description || ''}`;
      const existingTokens = this.tokenize(existingText);

      const jaccard = this.jaccardSimilarity(newTokens, existingTokens);
      const cosine = this.cosineSimilarity(newTokens, existingTokens);
      const avgScore = (jaccard + cosine) / 2;

      if (avgScore >= threshold) {
        const targetsSummary = this.formatTargetsSummary(assignment.targets);
        similar.push({
          id: assignment.id,
          title: assignment.title,
          description: assignment.description,
          teacherName: assignment.teacher.user.name,
          levelName: assignment.level.name,
          weekNumber: assignment.weekNumber,
          similarityScore: Math.round(avgScore * 100 * 100) / 100,
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
