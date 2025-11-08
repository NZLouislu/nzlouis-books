import { create } from 'zustand';
import { Book } from '../components/Books.type';
import { getBooksByGenre } from '../services/genreService';

interface BookDetails {
    id: string;
    title: string;
    covers?: number[];
    description?: string | { value: string };
    authors: Array<{ author: { name: string } }>;
}

interface BookState {
    books: Record<string, Book[]>;
    bookDetails: Record<string, BookDetails>;
    imageCache: Record<string, string>;
    totals: Record<string, number>;
    pages: Record<string, number>;
    loading: Record<string, boolean>;
    error: string | null;

    fetchBooks: (genre: string, limit: number, offset: number) => Promise<void>;
    setBookDetails: (bookId: string, details: BookDetails) => void;
    getBookDetails: (bookId: string) => BookDetails | undefined;
    cacheImage: (imageId: string, url: string) => void;
    getImageFromCache: (imageId: string) => string | undefined;
    reset: () => void;
}

export const useBookStore = create<BookState>((set, get) => ({
    books: {},
    bookDetails: {},
    imageCache: {},
    totals: {},
    pages: {},
    loading: {},
    error: null,

    fetchBooks: async (genre: string, limit: number, offset: number) => {
        const state = get();
        if (state.loading[genre]) return;

        set(state => ({
            loading: { ...state.loading, [genre]: true },
            error: null
        }));

        try {
            const { books: newBooks, total } = await getBooksByGenre(genre, limit, offset);

            set(state => {
                const existing = state.books[genre] || [];
                const unique = newBooks.filter(nb => !existing.some(eb => eb.id === nb.id));

                return {
                    books: {
                        ...state.books,
                        [genre]: [...existing, ...unique]
                    },
                    totals: { ...state.totals, [genre]: total },
                    pages: { ...state.pages, [genre]: Math.floor(offset / limit) },
                    loading: { ...state.loading, [genre]: false }
                };
            });
        } catch (error) {
            set(state => ({
                loading: { ...state.loading, [genre]: false },
                error: 'Failed to fetch books'
            }));
        }
    },

    setBookDetails: (bookId: string, details: BookDetails) => {
        set(state => ({
            bookDetails: { ...state.bookDetails, [bookId]: details }
        }));
    },

    getBookDetails: (bookId: string) => {
        return get().bookDetails[bookId];
    },

    cacheImage: (imageId: string, url: string) => {
        set(state => ({
            imageCache: { ...state.imageCache, [imageId]: url }
        }));
    },

    getImageFromCache: (imageId: string) => {
        return get().imageCache[imageId];
    },

    reset: () => set({
        books: {},
        bookDetails: {},
        imageCache: {},
        totals: {},
        pages: {},
        loading: {},
        error: null
    })
}));
