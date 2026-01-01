import { useMemo } from "react";

type RadiusSelectorProps = {
  postalCode: string;
  onPostalChange: (value: string) => void;
  radiusMiles: number;
  onRadiusChange: (value: number) => void;
  lat: number | null;
  lng: number | null;
  geoLoading: boolean;
  geoError: string | null;
  onUseMyLocation?: () => void;
  showUseMyLocation?: boolean;
  supportsRadius: boolean;
  disabled?: boolean;
};

type MapPreviewProps = {
  lat: number;
  lng: number;
  radiusKm: number;
};

function latLngToTile(lat: number, lng: number, zoom: number) {
  const latRad = (lat * Math.PI) / 180;
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

function metersPerPixel(lat: number, zoom: number) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom);
}

function pickZoom(radiusKm: number) {
  if (radiusKm <= 10) return 12;
  if (radiusKm <= 30) return 11;
  if (radiusKm <= 80) return 10;
  if (radiusKm <= 200) return 9;
  return 8;
}

function MapPreview({ lat, lng, radiusKm }: MapPreviewProps) {
  const zoom = pickZoom(radiusKm || 25);
  const { x, y } = latLngToTile(lat, lng, zoom);
  const tileUrl = `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
  const radiusPx = Math.min(
    80,
    Math.max(12, (radiusKm * 1000) / metersPerPixel(lat, zoom))
  );

  return (
    <div className="relative h-44 w-full overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${tileUrl})` }}
      />
      <svg className="absolute inset-0 h-full w-full">
        <circle
          cx="50%"
          cy="50%"
          r={radiusPx}
          fill="rgba(0, 229, 255, 0.12)"
          stroke="rgba(0, 229, 255, 0.6)"
          strokeWidth="2"
        />
        <circle cx="50%" cy="50%" r="5" fill="#00E5FF" />
      </svg>
      <div className="absolute bottom-2 left-3 rounded-full bg-black/70 px-2 py-1 text-xs text-white/80">
        {lat.toFixed(4)}, {lng.toFixed(4)}
      </div>
    </div>
  );
}

export function RadiusSelector({
  postalCode,
  onPostalChange,
  radiusMiles,
  onRadiusChange,
  lat,
  lng,
  geoLoading,
  geoError,
  onUseMyLocation,
  showUseMyLocation = false,
  supportsRadius,
  disabled = false,
}: RadiusSelectorProps) {
  const radiusKm = useMemo(() => radiusMiles * 1.60934, [radiusMiles]);

  return (
    <div className="rounded-xl border border-white/10 bg-[#0f0f0f] p-4 space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px]">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Postcode or ZIP
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => onPostalChange(e.target.value)}
            placeholder="Enter postcode or ZIP"
            className="w-full rounded-lg bg-black/40 border border-white/10 px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-[#00E5FF]/60 disabled:opacity-60"
            disabled={disabled}
          />
          {geoLoading && (
            <p className="mt-1 text-xs text-white/50">Resolving location...</p>
          )}
          {geoError && (
            <p className="mt-1 text-xs text-red-300">
              We could not resolve that location. Try another entry.
            </p>
          )}
        </div>
        <div className="flex flex-col justify-end gap-2">
          {showUseMyLocation && onUseMyLocation ? (
            <button
              type="button"
              onClick={onUseMyLocation}
              className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs font-semibold text-white/70 transition hover:border-[#00E5FF]/40 disabled:opacity-60"
              disabled={disabled}
            >
              Use my location
            </button>
          ) : null}
          <div className="text-xs text-white/50">
            Location accuracy varies by market.
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">
          {supportsRadius
            ? `Radius: ${radiusMiles} miles`
            : "Radius: not available"}
        </label>
        <input
          type="range"
          min={1}
          max={300}
          value={radiusMiles}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full accent-[#00E5FF] disabled:opacity-60"
          disabled={disabled || !supportsRadius}
        />
        <div className="mt-1 text-xs text-white/50">
          {supportsRadius
            ? `${radiusKm.toFixed(1)} km`
            : "Radius not available for this market."}
        </div>
        {!supportsRadius && (
          <div className="mt-1 text-xs text-white/50">
            Some selected markets do not support precise location filtering.
          </div>
        )}
      </div>

      {lat !== null && lng !== null ? (
        <MapPreview lat={lat} lng={lng} radiusKm={radiusKm} />
      ) : (
        <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-xs text-white/60">
          Add a postcode or ZIP to preview the map.
        </div>
      )}
    </div>
  );
}
