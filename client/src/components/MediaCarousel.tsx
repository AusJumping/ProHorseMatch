import { useState } from "react";
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

  const totalItems = media.length + videos.length;

  const nextMedia = () => {
    if (isVideo) {
      if (currentIndex < videos.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsVideo(false);
        setCurrentIndex(0);
      }
    } else {
      if (currentIndex < media.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (videos.length > 0) {
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
        setCurrentIndex(media.length - 1);
      }
    } else {
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
      } else if (videos.length > 0) {
        setIsVideo(true);
        setCurrentIndex(videos.length - 1);
      } else {
        setCurrentIndex(media.length - 1);
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
      {isVideo && videos.length > 0 ? (
        <div className="w-full h-full flex items-center justify-center bg-black">
          <video 
            className="max-h-full max-w-full" 
            controls
            src={videos[currentIndex]} 
          />
        </div>
      ) : (
        <div className="w-full aspect-[16/9] relative">
          <img 
            className="w-full h-full object-cover object-center"
            src={media[currentIndex]} 
            alt="Horse" 
            style={{ objectPosition: "center 35%" }}
          />
        </div>
      )}

      {/* Media type toggle */}
      {videos && videos.length > 0 && (
        <div className="absolute bottom-4 left-4 flex gap-2">
          <Button
            size="sm"
            variant={!isVideo ? "default" : "outline"}
            className={cn(
              "rounded-lg shadow-md",
              !isVideo ? "bg-white text-neutral-800" : "bg-white/80 hover:bg-white"
            )}
            onClick={() => setIsVideo(false)}
          >
            Photos
          </Button>
          <Button
            size="sm"
            variant={isVideo ? "default" : "outline"}
            className={cn(
              "rounded-lg shadow-md",
              isVideo ? "bg-primary text-white" : "bg-white/80 hover:bg-white"
            )}
            onClick={() => setIsVideo(true)}
          >
            <Play className="h-4 w-4 mr-1" />
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
      <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1">
        {media.map((_, index) => (
          <button
            key={`img-${index}`}
            className={`carousel-dot bg-white rounded-full w-2 h-2 opacity-70 ${
              !isVideo && index === currentIndex ? "active w-2.5 h-2.5 opacity-100" : ""
            }`}
            onClick={() => goToItem(index, false)}
          />
        ))}
        {videos.map((_, index) => (
          <button
            key={`vid-${index}`}
            className={`carousel-dot bg-primary rounded-full w-2 h-2 opacity-70 ${
              isVideo && index === currentIndex ? "active w-2.5 h-2.5 opacity-100" : ""
            }`}
            onClick={() => goToItem(index, true)}
          />
        ))}
      </div>
    </div>
  );
};

export default MediaCarousel;
