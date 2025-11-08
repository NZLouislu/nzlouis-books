import React, { useEffect, useState, useMemo } from "react";
import { Box, Divider, Heading, Image, Text, Skeleton, SkeletonText } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useOpenLibraryService } from "../../hooks/useOpenLibraryService";
import { useBookStore } from "../../stores/bookStore";

export interface BookCardProps {
  bookId: string;
}

export const BookCard: React.FC<BookCardProps> = ({ bookId }) => {
  const { book: apiBook, isLoading: apiLoading, error, getBookDetails: fetchBookDetails } = useOpenLibraryService();
  const { setBookDetails, getBookDetails: getCachedBookDetails, cacheImage, getImageFromCache } = useBookStore();
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imageLoaded, setImageLoaded] = useState(false);

  const bookKey = useMemo(() => bookId.replace("/works/", ""), [bookId]);
  
  // Try to get book details from cache
  const cachedBook = useMemo(() => getCachedBookDetails(bookKey), [bookKey, getCachedBookDetails]);
  const book = cachedBook || apiBook;
  const isLoading = !cachedBook && apiLoading;

  // Fetch book details if not in cache
  useEffect(() => {
    if (bookId && !cachedBook) {
      fetchBookDetails(bookKey);
    }
  }, [bookId, bookKey, cachedBook, fetchBookDetails]);

  // Cache book details fetched from API
  useEffect(() => {
    if (apiBook && !cachedBook) {
      setBookDetails(bookKey, { ...apiBook, id: bookKey });
    }
  }, [apiBook, bookKey, cachedBook, setBookDetails]);

  // Load image (prioritize cache)
  useEffect(() => {
    const loadImage = async () => {
      if (book?.covers && book.covers.length > 0) {
        const coverId = book.covers[0].toString();
        const cached = getImageFromCache(coverId);
        
        if (cached) {
          setImageSrc(cached);
          setImageLoaded(true);
        } else {
          const url = `https://covers.openlibrary.org/b/id/${book.covers[0]}-M.jpg`;
          setImageSrc(url);
          cacheImage(coverId, url);
          setImageLoaded(true);
        }
      } else {
        try {
          const defaultImage = (await import(`../../images/default.jpg`)).default;
          setImageSrc(defaultImage);
          setImageLoaded(true);
        } catch {
          setImageSrc("");
          setImageLoaded(true);
        }
      }
    };

    if (book) {
      loadImage();
    }
  }, [book, getImageFromCache, cacheImage]);

  if (isLoading || !imageLoaded) {
    return (
      <Box
        borderWidth="1px"
        borderRadius="lg"
        overflow="hidden"
        p={4}
        display="flex"
        flexDirection="column"
        height="100%"
      >
        <Skeleton height="400px" mb={3} />
        <SkeletonText mt="4" noOfLines={2} spacing="4" />
        <Skeleton mt="4" height="20px" width="50%" />
      </Box>
    );
  }

  if (error) {
    return <Text color="red.500">{error}</Text>;
  }

  if (!book) {
    return <Text>No book details available.</Text>;
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      as={Link}
      to={`/books/${bookId}`}
      display="flex"
      flexDirection="column"
      height="100%"
      position="relative"
    >
      <Box
        flex="1"
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
      >
        <Box>
          <Box position="relative">
            <Image
              src={imageSrc}
              alt={book.title}
              mb={3}
              height="400px"
              width="100%"
              sx={{ objectFit: "contain" }}
              loading="lazy"
            />
            <Box
              className="description-overlay"
              position="absolute"
              top="0"
              left="0"
              width="100%"
              height="100%"
              bg="rgba(0, 0, 0, 0.7)"
              color="white"
              display="flex"
              alignItems="center"
              justifyContent="center"
              opacity="0"
              transition="opacity 0.3s ease-in-out"
              _hover={{ opacity: 1 }}
              p={2}
              textAlign="center"
              zIndex="1"
            >
              {typeof book.description === "string"
                ? book.description.slice(0, 200)
                : book.description?.value?.slice(0, 200)}
              ...
            </Box>
          </Box>
          <Heading size="md" mb={2}>
            {book.title}
          </Heading>
        </Box>
        <Box mt={2}>
          <Divider my={2} />
          <Text>
            Author:{" "}
            {book.authors.map((author) => author.author.name).join(", ")}
          </Text>
        </Box>
      </Box>
    </Box>
  );
};
