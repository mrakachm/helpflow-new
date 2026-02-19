"use client";

export default function HelpFlowLogo({ size = 48 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      {/* Symbole bleu fluide (simple, premium) */}
      <div
        className="grid place-items-center rounded-2xl shadow-lg"
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          viewBox="0 0 64 64"
          fill="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="hfG" x1="10" y1="6" x2="56" y2="60">
              <stop stopColor="#60A5FA" />
              <stop offset="1" stopColor="#2563EB" />
            </linearGradient>
          </defs>

          {/* forme “flow” */}
          <path
            d="M18 10C27 4 38 6 46 12c8 7 12 18 8 28-4 10-14 18-25 16C18 54 8 44 10 32c1-9 3-16 8-22Z"
            fill="url(#hfG)"
          />
          {/* petit highlight discret */}
          <path
            d="M23 18c7-4 14-3 20 2"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Texte */}
      <div className="leading-tight">
        <div className="text-xl font-semibold tracking-tight text-white">
          HelpFlow
        </div>
        <div className="text-sm text-white/70">Livraison simple et efficace.</div>
      </div>
    </div>
  );
}