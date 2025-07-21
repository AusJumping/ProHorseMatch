import React from "react";
import { Horse } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import MediaCarousel from "@/components/MediaCarousel";
import { formatCurrency } from "@/lib/utils";

interface HorseGridProps {
  horses: Horse[];
  onShowMore: (horseId: number) => void;
}

const HorseGrid = ({ horses, onShowMore }: HorseGridProps) => {
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
    <div className="w-full">
      <div className="text-xs text-neutral-500 mb-3 ml-1">
        {horses.length} {horses.length === 1 ? 'horse matches' : 'horses match'} your criteria
      </div>
      <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
        {horses.map((horse) => (
          <Card key={horse.id} className="overflow-hidden flex flex-col w-[320px] flex-shrink-0">
            <div className="relative h-48 overflow-hidden">
              <MediaCarousel 
                media={horse.photos || []} 
                videos={horse.videos || []} 
              />
            </div>
            
            <CardContent className="flex flex-col flex-grow p-4">
              <div className="flex-grow">
                <h3 className="text-lg font-accent font-bold">{horse.name}</h3>
                
                {/* Lineage Information */}
                <div className="mt-1 text-sm text-gray-600 space-y-0.5">
                  <div>
                    <span className="font-medium">Sire:</span> {horse.sire || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Dam:</span> {horse.dam || "Not specified"}
                  </div>
                  <div>
                    <span className="font-medium">Dam Sire:</span> {horse.dam_sire || "Not specified"}
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <p>
                    {horse.age === 1 ? "Yearling" : `${horse.age} yrs`} • {horse.sex} • {(horse.height_hands as any) === "young_horse" || !horse.height_hands ? "Young Horse" : `${horse.height_hands}hh`}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <Button
                  size="sm"
                  className="info-button w-full bg-black hover:bg-gray-800 text-white"
                  onClick={() => onShowMore(horse.id)}
                >
                  <Info className="h-4 w-4 mr-1" />
                  More Info
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