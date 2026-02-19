import Header from "../components/landing/Header";
import Hero from "../components/landing/Hero";
import SpaceChoice from "../components/landing/SpaceChoice";
import WhyHelpFlow from "../components/landing/WhyHelpFlow";
import Footer from "../components/landing/Footer";

export default function Home() {
  return (
    <main className="bg-white">
      <Header />
      <Hero />
      <SpaceChoice />
      <WhyHelpFlow />
      <Footer />
    </main>
  )
}