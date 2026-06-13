function Card({
  title,
  desc,
}: {
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md" />
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return (
    <li className="rounded-2xl bg-white/70 px-4 py-3 text-sm font-medium text-slate-700">
      {children}
    </li>
  );
}

export default function WhyHelpFlow() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="rounded-[2rem] border border-blue-100 bg-white p-8 shadow-sm sm:p-10">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            C'est quoi HelpFlow ?
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
            Une plateforme locale pour simplifier vos déplacements du quotidien.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Vous avez oublié des lunettes à la maison, un document important au
            bureau, des clés chez un proche ou un achat à récupérer ? HelpFlow
            vous met en relation avec un livreur local disponible pour vous
            aider rapidement.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card
          title="Gagnez du temps"
          desc="Évitez les déplacements inutiles. Publiez votre besoin en quelques clics et concentrez-vous sur l'essentiel."
        />

        <Card
          title="Réduisez le stress"
          desc="Quand une urgence arrive, HelpFlow vous aide à trouver une solution locale claire et rapide."
        />

        <Card
          title="Accessible sans véhicule"
          desc="Même sans voiture ou utilitaire, vous pouvez faire transporter un objet, un colis ou un achat."
        />
      </div>

      <div className="mt-8 rounded-[2rem] bg-blue-600 p-8 text-white shadow-lg">
        <h2 className="text-3xl font-black">Des besoins simples, mais importants.</h2>

        <p className="mt-3 max-w-3xl text-blue-100">
          HelpFlow répond aux situations réelles du quotidien : oubli,
          urgence, manque de temps, transport difficile ou achat à récupérer.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl bg-white/15 p-4">Lunettes oubliées</div>
          <div className="rounded-2xl bg-white/15 p-4">Clés à récupérer</div>
          <div className="rounded-2xl bg-white/15 p-4">Document urgent</div>
          <div className="rounded-2xl bg-white/15 p-4">Achat en magasin</div>
          <div className="rounded-2xl bg-white/15 p-4">Colis à remettre</div>
          <div className="rounded-2xl bg-white/15 p-4">Objet encombrant</div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-8">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les clients
          </h2>

          <p className="mt-3 text-slate-600">
            Une solution simple pour faire transporter ce dont vous avez besoin,
            sans perdre votre journée.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Gagner du temps dans les déplacements</Line>
            <Line>Éviter de déranger ses proches</Line>
            <Line>Faire livrer même sans véhicule</Line>
            <Line>Récupérer un achat, un colis ou un document</Line>
            <Line>Réduire le stress des urgences du quotidien</Line>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-green-100 bg-green-50 p-8">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les livreurs
          </h2>

          <p className="mt-3 text-slate-600">
            Une opportunité flexible pour accepter des missions locales selon
            votre disponibilité.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Gagner un revenu complémentaire</Line>
            <Line>Choisir les missions qui vous conviennent</Line>
            <Line>Travailler près de votre zone</Line>
            <Line>Utiliser votre vélo, moto, voiture ou utilitaire</Line>
            <Line>Avancer à votre rythme avec des missions claires</Line>
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-4">
        <Card
          title="Simple"
          desc="Un parcours clair, sans complexité."
        />
        <Card
          title="Rapide"
          desc="Publiez votre besoin en quelques clics."
        />
        <Card
          title="Flexible"
          desc="Colis, courses, documents, objets ou achats."
        />
        <Card
          title="Local"
          desc="Des missions autour de vous."
        />
      </div>

      <div className="mt-8 rounded-[2rem] bg-slate-900 p-8 text-center text-white shadow-lg">
        <h2 className="text-3xl font-black">HelpFlow simplifie votre quotidien.</h2>

        <p className="mx-auto mt-4 max-w-3xl text-slate-300">
          Notre objectif est simple : connecter rapidement les personnes qui ont
          besoin d'aide avec des livreurs disponibles autour d'elles.
        </p>
      </div>
    </section>
  );
}