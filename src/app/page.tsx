import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import WhyHelpFlow from "../components/landing/WhyHelpFlow";
import Footer from "../components/landing/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50">
      <Header />
      <Hero />
      <WhyHelpFlow />
      <Footer />
    </main>
  );
}