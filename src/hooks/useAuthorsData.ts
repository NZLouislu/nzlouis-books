import { useEffect } from 'react';
import { useAuthorStore } from '../stores/authorStore';

export const useAuthorsData = (subject: string) => {
  const { authors, totals, pages, loading, error, fetchAuthors } = useAuthorStore();

  const limit = 9;
  const subjectAuthors = authors[subject] || [];
  const total = totals[subject] || 0;
  const page = pages[subject] || 0;
  const isLoading = loading[subject] || false;
  const hasMore = subjectAuthors.length < total;

  useEffect(() => {
    if (subjectAuthors.length === 0 && !isLoading) {
      fetchAuthors(subject, limit, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject]);

  const loadMore = () => {
    if (isLoading || !hasMore) return;
    fetchAuthors(subject, limit, page + 1);
  };

  return {
    authors: subjectAuthors,
    total,
    isLoading,
    error,
    hasMore,
    loadMore
  };
};
