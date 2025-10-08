export class DateUtils {
  static formatDate(date: Date, format: 'short' | 'long' | 'iso' = 'short'): string {
    switch (format) {
      case 'short':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      case 'iso':
        return date.toISOString();
      default:
        return date.toLocaleDateString();
    }
  }

  static isToday(date: Date): boolean {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }

  static addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }
}
