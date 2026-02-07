import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';

export const formatDate = (date: string | Date, formatStr = 'dd.MM.yyyy') => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: tr });
};

export const formatDateTime = (date: string | Date) => {
  return formatDate(date, 'dd.MM.yyyy HH:mm');
};

export const formatRelativeTime = (date: string | Date) => {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(dateObj, { 
    addSuffix: true, 
    locale: tr 
  });
};

export const isOverdue = (dueDate: string | Date) => {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  return due < new Date();
};

export const isStarted = (startDate: string | Date) => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  return start <= new Date();
};

/** "3 gün kaldı" veya "Yarın" benzeri kısa süre metni */
export const timeUntil = (dueDate: string | Date) => {
  const due = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const now = new Date();
  if (due < now) return 'Süresi geçti';
  return formatDistanceToNow(due, { addSuffix: false, locale: tr });
};
