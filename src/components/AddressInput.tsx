"use client";

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
    .replace(
      /\b(appartement|appt|app|étage|etage|bâtiment|batiment|bât|bat|porte|escalier|esc)\b.*$/gi,
      ""
    )
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export default function AddressInput({
  label,
  placeholder,
  value,
  onChange,
}: Props) {
  return (
    <div>
      {label ? (
        <label className="mb-1 block text-sm font-medium">{label}</label>
      ) : null}

      <input
        value={value}
        onChange={(e) => onChange(cleanAddress(e.target.value), {})}
        onBlur={(e) => onChange(cleanAddress(e.target.value), {})}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-gray-200 px-3 py-2"
      />
    </div>
  );
}