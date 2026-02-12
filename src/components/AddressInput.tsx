"use client";
/* global google */
import { useEffect, useRef } from "react";

type Props = {
  label: string;
  placeholder?: string;
  value: string;
  onChange: (fullAddress: string, parsed: { city?: string; postalCode?: string }) => void;
};

export default function AddressInput({ label, placeholder, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const acRef = useRef<google.maps.places.Autocomplete | null>(null);

  useEffect(() => {
    // Le script n'est peut-être pas encore chargé
    if (typeof window === "undefined" || typeof window.google === "undefined") return;
    if (!inputRef.current || acRef.current) return;

    const ac = new google.maps.places.Autocomplete(inputRef.current, {
      types: ["address"],
      componentRestrictions: { country: ["fr"] },
      fields: ["address_components", "formatted_address"],
    });
    acRef.current = ac;

    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const comps = place.address_components ?? [];

      const get = (type: string) => comps.find(c => c.types.includes(type))?.long_name;
      const city =
        get("postal_town") || get("locality") || get("administrative_area_level_2");
      const postalCode = get("postal_code") || "";

      onChange(place.formatted_address || value, { city, postalCode });
    });
  }, [value, onChange]);

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <input
        ref={inputRef}
        defaultValue={value}
        placeholder={placeholder}
        className="w-full rounded border px-3 py-2"
      />
    </div>
  );
}