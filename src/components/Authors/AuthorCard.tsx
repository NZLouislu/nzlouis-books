import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Box,
  Text,
  Heading,
  Image,
  VStack,
  Center,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { Author } from "../Books.type";
import { useAuthorStore } from "../../stores/authorStore";

interface AuthorCardProps {
  author: Author;
  onAuthorClick?: (authorKey: string) => void;
}

const AuthorCard: React.FC<AuthorCardProps> = ({ author, onAuthorClick }) => {
  const navigate = useNavigate();
  const { getImageFromCache, cacheImage } = useAuthorStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const imageId = useMemo(() => {
    if (Array.isArray(author.photos) && author.photos.length > 0) {
      return `photo-${author.photos[0]}`;
    } else if (author.key) {
      return `author-${author.key}`;
    }
    return "";
  }, [author.photos, author.key]);

  const imageUrl = useMemo(() => {
    const cached = getImageFromCache(imageId);
    if (cached) return cached;

    let url = "";
    if (Array.isArray(author.photos) && author.photos.length > 0) {
      url = `https://covers.openlibrary.org/a/id/${author.photos[0]}-L.jpg`;
    } else if (author.key) {
      const olid = author.key.replace("/authors/", "");
      url = `https://covers.openlibrary.org/a/olid/${olid}-L.jpg`;
    }
    
    if (url) {
      cacheImage(imageId, url);
    }
    return url;
  }, [author.photos, author.key, imageId, getImageFromCache, cacheImage]);

  const displayBio = useMemo(() => {
    if (typeof author.bio === "string") {
      return author.bio;
    }
    if (author.bio && typeof author.bio === "object" && "value" in author.bio) {
      return author.bio.value;
    }
    return "No bio available.";
  }, [author.bio]);

  const birthYear = useMemo(() => {
    if (!author.birth_date) return null;
    try {
      return new Date(author.birth_date).getFullYear();
    } catch {
      return null;
    }
  }, [author.birth_date]);

  const authorInitials = useMemo(() => {
    return author.name
      .split(" ")
      .filter((word) => word.length > 0)
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [author.name]);

  const avatarBgColor = useMemo(() => {
    const colors = [
      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
      "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
      "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
      "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
      "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
      "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
      "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
      "linear-gradient(135deg, #ff8a80 0%, #ea80fc 100%)",
      "linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%)",
      "linear-gradient(135deg, #b794f6 0%, #f093fb 100%)",
      "linear-gradient(135deg, #ffd89b 0%, #19547b 100%)",
    ];

    const hash = author.name
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);

    return colors[hash % colors.length];
  }, [author.name]);

  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setIsLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
      setIsLoading(true);
    } else {
      setImageError(true);
      setImageLoaded(false);
      setIsLoading(false);
    }
  }, [imageUrl, author.key]);

  const handleClick = useCallback(() => {
    if (onAuthorClick) {
      onAuthorClick(author.key);
    } else navigate(`/authors/${author.key}`);
  }, [onAuthorClick, navigate, author.key]);

  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      p={4}
      textAlign="center"
      cursor="pointer"
      onClick={handleClick}
      _hover={{
        shadow: "md",
        transform: "translateY(-2px)",
        borderColor: "blue.300",
      }}
      transition="all 0.2s ease-in-out"
      height="100%"
      display="flex"
      flexDirection="column"
      justifyContent="space-between"
      bg="white"
      _dark={{ bg: "gray.700" }}
    >
      <VStack spacing={3}>
        <Box
          position="relative"
          w="100px"
          h="100px"
          borderRadius="full"
          overflow="hidden"
          bg="gray.100"
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
          border="3px solid"
          borderColor="white"
          _dark={{
            bg: "gray.600",
            borderColor: "gray.700",
          }}
        >
          {isLoading && (
            <SkeletonCircle
              size="100px"
              position="absolute"
              top="0"
              left="0"
              startColor="gray.200"
              endColor="gray.300"
              _dark={{
                startColor: "gray.600",
                endColor: "gray.500",
              }}
            />
          )}

          {imageUrl && !imageError && (
            <Image
              src={imageUrl}
              alt={`Photo of ${author.name}`}
              w="100%"
              h="100%"
              objectFit="cover"
              onLoad={handleImageLoad}
              onError={handleImageError}
              opacity={imageLoaded ? 1 : 0}
              transition="opacity 0.3s ease-in-out"
              loading="lazy"
            />
          )}

          {(imageError || !imageUrl) && !isLoading && (
            <Center
              w="100%"
              h="100%"
              background={avatarBgColor}
              color="white"
              position="relative"
              overflow="hidden"
            >
              <Text
                fontSize={authorInitials.length === 1 ? "3xl" : "2xl"}
                fontWeight="700"
                fontFamily="'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
                letterSpacing="1px"
                textShadow="0 2px 4px rgba(0,0,0,0.2)"
              >
                {authorInitials}
              </Text>
            </Center>
          )}
        </Box>

        <VStack spacing={1}>
          <Skeleton
            isLoaded={!isLoading}
            height={isLoading ? "20px" : "auto"}
            width={isLoading ? "120px" : "auto"}
            startColor="gray.200"
            endColor="gray.300"
            _dark={{
              startColor: "gray.600",
              endColor: "gray.500",
            }}
          >
            <Heading as="h3" size="md" noOfLines={2} lineHeight="1.2">
              {author.name}
            </Heading>
          </Skeleton>

          {birthYear && (
            <Skeleton
              isLoaded={!isLoading}
              height={isLoading ? "14px" : "auto"}
              width={isLoading ? "80px" : "auto"}
              startColor="gray.200"
              endColor="gray.300"
              _dark={{
                startColor: "gray.600",
                endColor: "gray.500",
              }}
            >
              <Text fontSize="xs" color="gray.500">
                Born {birthYear}
              </Text>
            </Skeleton>
          )}
        </VStack>

        <Box width="100%">
          <SkeletonText
            isLoaded={!isLoading}
            noOfLines={3}
            spacing="2"
            skeletonHeight="12px"
            startColor="gray.200"
            endColor="gray.300"
            _dark={{
              startColor: "gray.600",
              endColor: "gray.500",
            }}
          >
            <Text
              fontSize="sm"
              noOfLines={3}
              color="gray.600"
              _dark={{ color: "gray.300" }}
              lineHeight="1.4"
            >
              {displayBio}
            </Text>
          </SkeletonText>
        </Box>
      </VStack>
    </Box>
  );
};

export default AuthorCard;
