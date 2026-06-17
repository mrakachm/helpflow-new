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

function cleanAddress(text: string) {
  return String(text || "")
    .replace(/\b(RDC|DRC|rez-de-chaussée|rez de chaussée)\b/gi, "")
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractAddress(place: any, inputValue: string) {
  const comps = place?.address_components || [];

  const get = (type: string) =>
    comps.find((c: any) => c.types.includes(type))?.long_name || "";

  const streetNumber = get("street_number");
  const route = get("route");

  const city =
    get("locality") ||
    get("postal_town") ||
    get("administrative_area_level_2") ||
    "";

  const postalCode = get("postal_code") || "";

  const address =
    [streetNumber, route].filter(Boolean).join(" ") ||
    place?.formatted_address ||
    inputValue ||
    "";

  return {
    address: cleanAddress(address),
    city,
    postalCode,
  };
}

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const acRef = useRef<any>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let listener: any = null;

    function initAutocomplete() {
      if (typeof window === "undefined") return;

      const googleMaps = (window as any).google;

      if (!googleMaps?.maps?.places?.Autocomplete) {
        timer = setTimeout(initAutocomplete, 500);
        return;
      }

      if (!inputRef.current || acRef.current) return;

      const ac = new googleMaps.maps.places.Autocomplete(inputRef.current, {
        types: ["address"],
        componentRestrictions: { country: "fr" },
        fields: ["address_components", "formatted_address", "geometry"],
      });

      acRef.current = ac;

      listener = ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const parsed = extractAddress(place, inputRef.current?.value || "");

        onChangeRef.current(parsed.address, {
          city: parsed.city,
          postalCode: parsed.postalCode,
        });
      });
    }

    initAutocomplete();

    return () => {
      if (timer) clearTimeout(timer);
      if (listener?.remove) listener.remove();
      acRef.current = null;
    };
  }, []);

  return (
    <div>
      {label ? (
        <label className="mb-1 block text-sm font-medium">{label}</label>
      ) : null}

      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value, {})}
        onBlur={(e) => onChange(cleanAddress(e.target.value), {})}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-gray-200 px-3 py-2"
      />
    </div>
  );
}