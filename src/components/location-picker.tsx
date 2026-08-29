"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { LocateFixed } from "lucide-react";
import { Button } from "@/components/ui/button";

const LocationPickerInner = dynamic(() => import("./location-picker-inner"), {
  ssr: false,
  loading: () => <div className="h-[260px] animate-pulse rounded-lg border bg-muted" />,
});

// Roughly centers on Uzbekistan when nothing is picked yet.
const UZBEKISTAN_CENTER = { lat: 41.3775, lng: 64.5853 };

type Coords = { lat: number; lng: number };

export function LocationPicker({
  value,
  onChange,
  height = 260,
}: {
  value: Coords | null;
  onChange: (coords: Coords) => void;
  height?: number;
}) {
  const [locating, setLocating] = useState(false);

  function useMyLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="space-y-2">
      <LocationPickerInner
        value={value}
        onChange={onChange}
        defaultCenter={UZBEKISTAN_CENTER}
        defaultZoom={6}
        height={height}
      />
      <div className="flex items-center justify-between gap-2">
        <Button type="button" variant="outline" size="sm" onClick={useMyLocation} disabled={locating}>
          <LocateFixed className="size-3.5" />
          {locating ? "Aniqlanmoqda..." : "Joriy joylashuvim"}
        </Button>
        {value && (
          <span className="text-xs text-muted-foreground">
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </span>
        )}
      </div>
      <p className="text-xs text-muted-foreground">Xaritada bosib yoki belgini sudrab aniq nuqtani tanlang.</p>
    </div>
  );
}
