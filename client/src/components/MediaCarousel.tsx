import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMobile } from "@/hooks/use-mobile";

interface MediaCarouselProps {
  media: string[];
  videos?: string[];
}

const MediaCarousel = ({ media, videos = [] }: MediaCarouselProps) => {
  const isMobile = useMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideo, setIsVideo] = useState(false);
  
  // Safety check to ensure media is always an array
  const safeMedia = Array.isArray(media) ? media : [];
  const safeVideos = Array.isArray(videos) ? videos : [];
  
  // Reset index if media changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsVideo(false);
  }, [safeMedia, safeVideos]);

  const totalItems = safeMedia.length + safeVideos.length;

  const nextMedia = () => {
    if (isVideo) {
      if (currentIndex < safeVideos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsVideo(false);
        setCurrentIndex(0);
      }
    } else {
      if (currentIndex < safeMedia.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (safeVideos.length > 0) {
        setIsVideo(true);
        setCurrentIndex(0);
      } else {
        setCurrentIndex(0);
      }
    }
  };

  const prevMedia = () => {
    if (isVideo) {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else {
        setIsVideo(false);
        setCurrentIndex(safeMedia.length - 1);
      }
    } else {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (safeVideos.length > 0) {
        setIsVideo(true);
        setCurrentIndex(safeVideos.length - 1);
      } else {
        setCurrentIndex(safeMedia.length - 1);
      }
    }
  };

  const goToItem = (index: number, isVid: boolean) => {
    setCurrentIndex(index);
    setIsVideo(isVid);
  };

  return (
    <div className="relative h-full w-full">
      {/* Main Image/Video Display */}
      {isVideo && safeVideos.length > 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video 
            className="max-h-full max-w-full" 
            controls
            src={safeVideos[currentIndex]} 
          />
        </div>
      ) : (
        <div className="w-full h-full relative bg-gray-100">
          {safeMedia.length > 0 ? (
            <img 
              className="w-full h-full object-cover object-center"
              src={safeMedia[currentIndex]} 
              alt="Horse" 
              style={{ objectPosition: "center 35%" }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-gray-500">No images available</p>
            </div>
          )}
        </div>
      )}

      {/* Media type toggle */}
      {safeVideos.length > 0 && (
        <div className="absolute bottom-4 left-4 flex gap-1">
          <Button
            size="xs"
            variant={!isVideo ? "default" : "outline"}
            className={cn(
              "rounded-md shadow-md text-xs px-2 py-1 h-6",
              !isVideo ? "bg-white text-neutral-800" : "bg-white/80 hover:bg-white"
            )}
            onClick={() => setIsVideo(false)}
          >
            Photos
          </Button>
          <Button
            size="xs"
            variant={isVideo ? "default" : "outline"}
            className={cn(
              "rounded-md shadow-md text-xs px-2 py-1 h-6",
              isVideo ? "bg-primary text-white" : "bg-white/80 hover:bg-white"
            )}
            onClick={() => setIsVideo(true)}
          >
            <Play className="h-3 w-3 mr-0.5" />
            Videos
          </Button>
        </div>
      )}

      {/* Navigation Buttons */}
      {totalItems > 1 && (
        <>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-1/2 left-2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8"
            onClick={prevMedia}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="absolute top-1/2 right-2 transform -translate-y-1/2 bg-black bg-opacity-30 hover:bg-opacity-50 text-white rounded-full w-8 h-8"
            onClick={nextMedia}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </>
      )}

      {/* Dot indicators */}
      {totalItems > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
          {safeMedia.map((_, index) => (
            <button
              key={`img-${index}`}
              className={`carousel-dot bg-white rounded-full w-2 h-2 opacity-70 ${
                !isVideo && index === currentIndex ? "active w-2.5 h-2.5 opacity-100" : ""
              }`}
              onClick={() => goToItem(index, false)}
            />
          ))}
          {safeVideos.map((_, index) => (
            <button
              key={`vid-${index}`}
              className={`carousel-dot bg-primary rounded-full w-2 h-2 opacity-70 ${
                isVideo && index === currentIndex ? "active w-2.5 h-2.5 opacity-100" : ""
              }`}
              onClick={() => goToItem(index, true)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaCarousel;
