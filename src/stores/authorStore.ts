import { create } from 'zustand';
import { Author } from '../components/Books.type';
import { getAuthorsBySubject } from '../services/authorService';

interface AuthorState {
    authors: Record<string, Author[]>;
    imageCache: Record<string, string>;
    totals: Record<string, number>;
    pages: Record<string, number>;
    loading: Record<string, boolean>;
    error: string | null;

    fetchAuthors: (subject: string, limit: number, page: number) => Promise<void>;
    cacheImage: (imageId: string, url: string) => void;
    getImageFromCache: (imageId: string) => string | undefined;
    reset: () => void;
}

export const useAuthorStore = create<AuthorState>((set, get) => ({
    authors: {},
    imageCache: {},
    totals: {},
    pages: {},
    loading: {},
    error: null,

    fetchAuthors: async (subject: string, limit: number, page: number) => {
        const state = get();
        if (state.loading[subject]) return;

        set(state => ({
            loading: { ...state.loading, [subject]: true },
            error: null
        }));

        try {
            const { authors: newAuthors, total } = await getAuthorsBySubject(subject, limit, page);

            set(state => {
                const existing = state.authors[subject] || [];
                const existingKeys = new Set(existing.map(a => a.key));
                const unique = newAuthors.filter(a => !existingKeys.has(a.key));

                return {
                    authors: {
                        ...state.authors,
                        [subject]: [...existing, ...unique]
                    },
                    totals: { ...state.totals, [subject]: total },
                    pages: { ...state.pages, [subject]: page },
                    loading: { ...state.loading, [subject]: false }
                };
            });
        } catch (error) {
            set(state => ({
                loading: { ...state.loading, [subject]: false },
                error: 'Failed to fetch authors'
            }));
        }
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
        authors: {},
        imageCache: {},
        totals: {},
        pages: {},
        loading: {},
        error: null
    })
}));
