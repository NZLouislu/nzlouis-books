import React, { useState, useEffect } from 'react';
import { Image, ImageProps, Skeleton } from '@chakra-ui/react';

interface OptimizedImageProps extends ImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  onLoadComplete?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  fallbackSrc,
  onLoadComplete,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    setCurrentSrc(src);
  }, [src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
    onLoadComplete?.();
  };

  const handleError = () => {
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setError(false);
    } else {
      setError(true);
      setIsLoaded(true);
    }
  };

  if (error && !fallbackSrc) {
    return null;
  }

  return (
    <>
      {!isLoaded && (
        <Skeleton
          position="absolute"
          top={0}
          left={0}
          width="100%"
          height="100%"
        />
      )}
      <Image
        src={currentSrc}
        alt={alt}
        onLoad={handleLoad}
        onError={handleError}
        opacity={isLoaded ? 1 : 0}
        transition="opacity 0.3s ease-in-out"
        loading="lazy"
        {...props}
      />
    </>
  );
};
