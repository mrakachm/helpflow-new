"use client";

import { useEffect, useRef } from "react";

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (
    fullAddress: string,
    parsed: { city?: string; postalCode?: string }
  ) => void;
};

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const acRef = useRef<any>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    function initAutocomplete() {
      if (typeof window === "undefined") return;

      const googleMaps = (window as any).google;

      if (!googleMaps?.maps?.places) {
        timer = setTimeout(initAutocomplete, 300);
        return;
      }

      if (!inputRef.current || acRef.current) return;

      const ac = new googleMaps.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "fr" },
        fields: ["address_components", "formatted_address", "geometry"],
      });

      acRef.current = ac;

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const comps = place.address_components ?? [];

        const get = (type: string) =>
          comps.find((component: any) => component.types.includes(type))
            ?.long_name || "";

        const city =
          get("locality") ||
          get("postal_town") ||
          get("administrative_area_level_2");

        const postalCode = get("postal_code");

        onChange(place.formatted_address || inputRef.current?.value || "", {
          city,
          postalCode,
        });
      });
    }

    initAutocomplete();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [onChange]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value, {})}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded border px-3 py-2"
      />
    </div>
  );
}