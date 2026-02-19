export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-5xl px-6 py-10 text-center text-sm text-slate-500">
      <p>© {new Date().getFullYear()} HelpFlow — Plateforme de livraison locale</p>
    </footer>
  );
}