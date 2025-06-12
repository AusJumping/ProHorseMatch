import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { ImageOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallback?: React.ReactNode;
  width?: number;
  height?: number;
}

const Image: React.FC<ImageProps> = ({
  src,
  alt = "",
  className,
  fallback,
  width,
  height,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className={cn("relative overflow-hidden", className)}>
      {isLoading && (
        <Skeleton className="absolute inset-0 z-10" />
      )}
      
      {hasError ? (
        fallback || (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <ImageOff className="h-10 w-10 text-gray-400" />
          </div>
        )
      ) : (
        <img
          src={src}
          alt={alt}
          className={cn("w-full h-full", { "opacity-0": isLoading })}
          onLoad={handleLoad}
          onError={handleError}
          width={width}
          height={height}
          loading="lazy"
          {...props}
        />
      )}
    </div>
  );
};

export default Image;