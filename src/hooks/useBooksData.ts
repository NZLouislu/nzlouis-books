import { useEffect } from 'react';
import { useBookStore } from '../stores/bookStore';

export const useBooksData = (genre: string) => {
  const { books, totals, loading, error, fetchBooks } = useBookStore();

  const limit = 9;
  const genreBooks = books[genre] || [];
  const total = totals[genre] || 0;
  const isLoading = loading[genre] || false;
  const hasMore = genreBooks.length < total;

  useEffect(() => {
    if (genreBooks.length === 0 && !isLoading) {
      fetchBooks(genre, limit, 0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [genre]);

  const loadMore = () => {
    if (isLoading || !hasMore) return;
    const offset = genreBooks.length;
    fetchBooks(genre, limit, offset);
  };

  return {
    books: genreBooks,
    total,
    isLoading,
    error,
    hasMore,
    loadMore
  };
};
