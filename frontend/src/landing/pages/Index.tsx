import { useState } from "react";
import Navbar from "@/landing/components/Navbar";
import HeroSection from "@/landing/components/HeroSection";
import AboutSection from "@/landing/components/AboutSection";
import ServicesSection from "@/landing/components/ServicesSection";
import Footer from "@/landing/components/Footer";
import ParticlesBackground from "@/landing/components/ParticlesBackground";
import CinematicIntro from "@/landing/components/CinematicIntro";

const Index = ({ onLaunch }: { onLaunch?: () => void }) => {
  const [introComplete, setIntroComplete] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleLaunch = () => {
    setIsExiting(true);
    setTimeout(() => {
      onLaunch?.();
    }, 800); // Wait for fade out
  };

  return (
    <>
      {!introComplete && <CinematicIntro onComplete={() => setIntroComplete(true)} />}
      <div className={`relative min-h-screen bg-[#0a0a0a] transition-opacity duration-800 ease-in-out ${introComplete && !isExiting ? "opacity-100" : "opacity-0"}`}>
        <ParticlesBackground />
        <Navbar />
        <main>
          <HeroSection onLaunch={handleLaunch} />
          <AboutSection />
          <ServicesSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
