import React from "react";
import { Horse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Heart, X, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "@/components/ui/image";
import { formatCurrency } from "@/lib/utils";

interface HorseGridProps {
  horses: Horse[];
  onLike: (horseId: number) => void;
  onDislike: (horseId: number) => void;
  onShowMore: (horseId: number) => void;
  isLoading?: boolean;
}

const HorseGrid = ({ horses, onLike, onDislike, onShowMore, isLoading = false }: HorseGridProps) => {
  // Show loading skeletons during data fetching
  if (isLoading) {
    return (
      <div className="w-full">
        <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="overflow-hidden flex flex-col w-[320px] flex-shrink-0">
              <Skeleton className="h-48 w-full" />
              <CardContent className="flex flex-col flex-grow p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  // Show empty state only after loading is complete
  if (!horses.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
        <h3 className="text-xl font-display font-bold mb-4">No horses found</h3>
        <p className="text-neutral-600 mb-6">
          No horses match your current search criteria. Try adjusting your filters.
        </p>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => window.location.href = "/"}>
            Reset Filters
          </Button>
          <Button onClick={() => window.location.reload()}>Refresh</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-xs text-neutral-500 mb-3 ml-1">
        {horses.length} {horses.length === 1 ? 'horse' : 'horses'} match your criteria
      </div>
      <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
        {horses.map((horse) => (
          <Card key={horse.id} className="overflow-hidden flex flex-col w-[320px] flex-shrink-0">
            <div className="relative h-48 overflow-hidden">
              {horse.photos && horse.photos.length > 0 ? (
                <Image
                  src={horse.photos[0]}
                  alt={horse.name}
                  className="w-full h-full object-cover"
                  width={400}
                  height={300}
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image</span>
                </div>
              )}
            </div>
            
            <CardContent className="flex flex-col flex-grow p-4">
              <div className="flex-grow">
                <h3 className="text-lg font-accent font-bold">{horse.name}</h3>
                <div className="mt-1 text-sm text-gray-600">
                  {horse.sire && horse.dam_sire ? (
                    <p>{horse.sire} x {horse.dam_sire}</p>
                  ) : horse.sire ? (
                    <p>{horse.sire}</p>
                  ) : (
                    <p className="text-gray-400">Breeding not specified</p>
                  )}
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    {horse.age} yrs • {horse.sex} • {horse.height_hands}hh
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <Button
                  size="sm"
                  variant="outline"
                  className="pass-button"
                  onClick={() => onDislike(horse.id)}
                >
                  <X className="h-4 w-4 mr-1" />
                  Pass
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  className="info-button"
                  onClick={() => onShowMore(horse.id)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  Info
                </Button>
                
                <Button
                  size="sm"
                  className="like-button"
                  onClick={() => onLike(horse.id)}
                  style={{ backgroundColor: "#cdac6e", borderColor: "#cdac6e", color: "white" }}
                >
                  <Heart className="h-4 w-4 mr-1" />
                  Like
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default HorseGrid;