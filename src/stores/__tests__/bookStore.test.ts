import { renderHook, act, waitFor } from '@testing-library/react';
import { useBookStore } from '../bookStore';
import * as genreService from '../../services/genreService';

jest.mock('../../services/genreService');

describe('bookStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useBookStore());
    act(() => {
      result.current.reset();
    });
    jest.clearAllMocks();
  });

  describe('Book Details Cache', () => {
    it('should cache and retrieve book details', () => {
      const { result } = renderHook(() => useBookStore());

      const mockBookDetails = {
        id: 'OL123W',
        title: 'Test Book',
        covers: [12345],
        description: 'A test book',
        authors: [{ author: { name: 'Test Author' } }],
      };

      act(() => {
        result.current.setBookDetails('OL123W', mockBookDetails);
      });

      const cached = result.current.getBookDetails('OL123W');
      expect(cached).toEqual(mockBookDetails);
    });

    it('should return undefined for uncached book details', () => {
      const { result } = renderHook(() => useBookStore());

      const cached = result.current.getBookDetails('nonexistent');
      expect(cached).toBeUndefined();
    });

    it('should cache multiple book details', () => {
      const { result } = renderHook(() => useBookStore());

      const book1 = {
        id: 'OL123W',
        title: 'Book 1',
        covers: [111],
        authors: [{ author: { name: 'Author 1' } }],
      };

      const book2 = {
        id: 'OL456W',
        title: 'Book 2',
        covers: [222],
        authors: [{ author: { name: 'Author 2' } }],
      };

      act(() => {
        result.current.setBookDetails('OL123W', book1);
        result.current.setBookDetails('OL456W', book2);
      });

      expect(result.current.getBookDetails('OL123W')).toEqual(book1);
      expect(result.current.getBookDetails('OL456W')).toEqual(book2);
    });
  });

  describe('Image Cache', () => {
    it('should cache and retrieve image URLs', () => {
      const { result } = renderHook(() => useBookStore());

      act(() => {
        result.current.cacheImage('12345', 'https://example.com/image.jpg');
      });

      const cached = result.current.getImageFromCache('12345');
      expect(cached).toBe('https://example.com/image.jpg');
    });

    it('should return undefined for uncached images', () => {
      const { result } = renderHook(() => useBookStore());

      const cached = result.current.getImageFromCache('nonexistent');
      expect(cached).toBeUndefined();
    });

    it('should cache multiple images', () => {
      const { result } = renderHook(() => useBookStore());

      act(() => {
        result.current.cacheImage('111', 'https://example.com/image1.jpg');
        result.current.cacheImage('222', 'https://example.com/image2.jpg');
        result.current.cacheImage('333', 'https://example.com/image3.jpg');
      });

      expect(result.current.getImageFromCache('111')).toBe('https://example.com/image1.jpg');
      expect(result.current.getImageFromCache('222')).toBe('https://example.com/image2.jpg');
      expect(result.current.getImageFromCache('333')).toBe('https://example.com/image3.jpg');
    });
  });

  describe('Book List Cache', () => {
    it('should cache book list by genre', async () => {
      const mockBooks = [
        { id: '1', title: 'Book 1', author: 'Author 1', type: 'fiction' },
        { id: '2', title: 'Book 2', author: 'Author 2', type: 'fiction' },
      ];

      (genreService.getBooksByGenre as jest.Mock).mockResolvedValue({
        books: mockBooks,
        total: 100,
      });

      const { result } = renderHook(() => useBookStore());

      await act(async () => {
        await result.current.fetchBooks('fiction', 9, 0);
      });

      await waitFor(() => {
        expect(result.current.books['fiction']).toEqual(mockBooks);
        expect(result.current.totals['fiction']).toBe(100);
        expect(result.current.loading['fiction']).toBe(false);
      });
    });

    it('should use cache when switching back to previous genre', async () => {
      const fictionBooks = [
        { id: '1', title: 'Fiction Book', author: 'Author 1', type: 'fiction' },
      ];
      const scienceBooks = [
        { id: '2', title: 'Science Book', author: 'Author 2', type: 'science' },
      ];

      (genreService.getBooksByGenre as jest.Mock)
        .mockResolvedValueOnce({ books: fictionBooks, total: 50 })
        .mockResolvedValueOnce({ books: scienceBooks, total: 30 });

      const { result } = renderHook(() => useBookStore());

      // Load fiction genre
      await act(async () => {
        await result.current.fetchBooks('fiction', 9, 0);
      });

      await waitFor(() => {
        expect(result.current.books['fiction']).toEqual(fictionBooks);
      });

      // Load science genre
      await act(async () => {
        await result.current.fetchBooks('science', 9, 0);
      });

      await waitFor(() => {
        expect(result.current.books['science']).toEqual(scienceBooks);
      });

      // Verify fiction cache still exists
      expect(result.current.books['fiction']).toEqual(fictionBooks);
      expect(result.current.books['science']).toEqual(scienceBooks);
    });

    it('should prevent duplicate loading', async () => {
      const mockBooks = [
        { id: '1', title: 'Book 1', author: 'Author 1', type: 'fiction' },
      ];

      (genreService.getBooksByGenre as jest.Mock).mockResolvedValue({
        books: mockBooks,
        total: 10,
      });

      const { result } = renderHook(() => useBookStore());

      // Trigger multiple requests simultaneously
      await act(async () => {
        const promises = [
          result.current.fetchBooks('fiction', 9, 0),
          result.current.fetchBooks('fiction', 9, 0),
          result.current.fetchBooks('fiction', 9, 0),
        ];
        await Promise.all(promises);
      });

      // Should only call API once
      expect(genreService.getBooksByGenre).toHaveBeenCalledTimes(1);
    });

    it('should support pagination', async () => {
      const firstPageBooks = [
        { id: '1', title: 'Book 1', author: 'Author 1', type: 'fiction' },
        { id: '2', title: 'Book 2', author: 'Author 2', type: 'fiction' },
      ];

      const secondPageBooks = [
        { id: '3', title: 'Book 3', author: 'Author 3', type: 'fiction' },
        { id: '4', title: 'Book 4', author: 'Author 4', type: 'fiction' },
      ];

      (genreService.getBooksByGenre as jest.Mock)
        .mockResolvedValueOnce({ books: firstPageBooks, total: 100 })
        .mockResolvedValueOnce({ books: secondPageBooks, total: 100 });

      const { result } = renderHook(() => useBookStore());

      // Load first page
      await act(async () => {
        await result.current.fetchBooks('fiction', 2, 0);
      });

      await waitFor(() => {
        expect(result.current.books['fiction']).toHaveLength(2);
      });

      // Load second page
      await act(async () => {
        await result.current.fetchBooks('fiction', 2, 2);
      });

      await waitFor(() => {
        expect(result.current.books['fiction']).toHaveLength(4);
        expect(result.current.books['fiction']).toEqual([
          ...firstPageBooks,
          ...secondPageBooks,
        ]);
      });
    });
  });

  describe('reset', () => {
    it('should clear all cache', async () => {
      const { result } = renderHook(() => useBookStore());

      const mockBooks = [
        { id: '1', title: 'Book 1', author: 'Author 1', type: 'fiction' },
      ];

      (genreService.getBooksByGenre as jest.Mock).mockResolvedValue({
        books: mockBooks,
        total: 10,
      });

      // Add some data
      await act(async () => {
        await result.current.fetchBooks('fiction', 9, 0);
        result.current.cacheImage('123', 'https://example.com/image.jpg');
        result.current.setBookDetails('OL123W', {
          id: 'OL123W',
          title: 'Test',
          covers: [123],
          authors: [{ author: { name: 'Author' } }],
        });
      });

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify all data is cleared
      expect(result.current.books).toEqual({});
      expect(result.current.bookDetails).toEqual({});
      expect(result.current.imageCache).toEqual({});
      expect(result.current.totals).toEqual({});
      expect(result.current.pages).toEqual({});
      expect(result.current.loading).toEqual({});
      expect(result.current.error).toBeNull();
    });
  });
});
