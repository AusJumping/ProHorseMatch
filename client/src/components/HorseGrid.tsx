import React from "react";
import { Horse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Heart, X, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Image from "@/components/ui/image";
import { formatCurrency } from "@/lib/utils";

interface HorseGridProps {
  horses: Horse[];
  onLike: (horseId: number) => void;
  onDislike: (horseId: number) => void;
  onShowMore: (horseId: number) => void;
}

const HorseGrid = ({ horses, onLike, onDislike, onShowMore }: HorseGridProps) => {
  if (!horses.length) {
    return (
      <div className="w-full flex flex-col items-center justify-center h-[500px] bg-white rounded-xl p-8 text-center">
        <h3 className="text-xl font-display font-bold mb-4">No horses in database</h3>
        <p className="text-neutral-600 mb-6">
          There are currently no horses in the database. Add some horses to get started.
        </p>
        <Button onClick={() => window.location.reload()}>Refresh</Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
      {horses.map((horse) => (
        <Card key={horse.id} className="overflow-hidden h-full flex flex-col">
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
              <h3 className="text-lg font-display font-bold">{horse.name}</h3>
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
                <p className="font-semibold mt-1">
                  {formatCurrency(horse.price, horse.currency)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 sm:gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="pass-button text-xs sm:text-sm"
                onClick={() => onDislike(horse.id)}
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Pass</span>
                <span className="xs:hidden">X</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="info-button text-xs sm:text-sm"
                onClick={() => onShowMore(horse.id)}
              >
                <Info className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Info</span>
                <span className="xs:hidden">I</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="like-button text-xs sm:text-sm"
                onClick={() => onLike(horse.id)}
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                <span className="hidden xs:inline">Like</span>
                <span className="xs:hidden">L</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default HorseGrid;