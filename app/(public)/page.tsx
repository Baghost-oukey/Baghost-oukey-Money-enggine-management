import { FaqsSection } from "@/components/faq";
import { FeatureSection } from "@/components/feature-section";
import Footer from "@/components/footer";
import { Header } from "@/components/header";
import HeroSection1 from "@/components/hero-section-1";
import Image from "next/image";

export default function Home() {
  return (
    <div>
      <Header />
     <HeroSection1 />
     <FeatureSection />
     <FaqsSection />
     <Footer />
    </div>
  );
}
