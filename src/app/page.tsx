import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F6FAFF] text-slate-900">
      {/* halo / fond premium */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-blue-200/50 blur-3xl" />
        <div className="absolute -bottom-40 right-[-120px] h-[520px] w-[520px] rounded-full bg-sky-200/40 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-md px-5 pb-10 pt-10">
        {/* header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
              {/* si ton logo est dans /public/logo-helpflow.png */}
              <Image
                src="/logo-helpflow.png"
                alt="HelpFlow"
                width={48}
                height={48}
                className="h-full w-full object-contain p-1"
                priority
              />
            </div>

            <div className="leading-tight">
              <p className="text-lg font-semibold">HelpFlow</p>
              <p className="text-xs text-slate-500">
                Une livraison simple pour faciliter votre quotidien
              </p>
            </div>
          </div>

          <Link
            href="/login"
            className="rounded-xl bg-white px-4 py-2 text-xs font-semibold text-slate-800 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
          >
            Connexion
          </Link>
        </header>

        {/* title */}
        <section className="mt-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Choisissez votre espace
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Accédez à votre interface en un clic.
          </p>
        </section>

        {/* cards */}
        <section className="mt-7 grid gap-4">
          <ChoiceCard
            href="/client/new-order"
            emoji="📦"
            title="Espace client"
            subtitle="Créer une mission et suivre la livraison"
            accent="blue"
          />
          <ChoiceCard
            href="/livreur/missions"
            emoji="🚴‍♂️"
            title="Espace livreur"
            subtitle="Voir les missions et accepter une livraison"
            accent="sky"
          />
        </section>

        {/* trust / slogan */}
        <section className="mt-8 rounded-2xl border border-blue-100 bg-white/70 p-4 backdrop-blur">
          <p className="text-sm font-semibold text-slate-900">
            La solidarité ne reste pas à la maison.
          </p>
          <p className="mt-1 text-sm text-slate-600">Elle marche avec toi.</p>
        </section>

        {/* footer */}
        <footer className="mt-10 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} HelpFlow — Plateforme de livraison locale
        </footer>
      </div>
    </main>
  );
}

function ChoiceCard({
  href,
  emoji,
  title,
  subtitle,
  accent,
}: {
  href: string;
  emoji: string;
  title: string;
  subtitle: string;
  accent: "blue" | "sky";
}) {
  const accentRing =
    accent === "blue" ? "ring-blue-200/60" : "ring-sky-200/60";
  const accentBg =
    accent === "blue" ? "bg-blue-600" : "bg-sky-600";

  return (
    <Link
      href={href}
      className="group block rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-4">
          <div
            className={`grid h-12 w-12 place-items-center rounded-2xl bg-slate-50 text-xl ring-1 ${accentRing}`}
          >
            {emoji}
          </div>

          <div>
            <p className="text-base font-semibold text-slate-900">{title}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p>
          </div>
        </div>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${accentBg}`}
        >
          Ouvrir →
        </span>
      </div>
    </Link>
  );
}
