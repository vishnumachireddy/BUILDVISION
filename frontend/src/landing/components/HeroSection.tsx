import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/landing/components/ui/button";
import { ArrowRight } from "lucide-react";

const typingWords = ["AI Planning", "Real-Time Analytics", "Smart Resource Optimization"];

const HeroSection = ({ onLaunch }: { onLaunch?: () => void }) => {
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = typingWords[wordIndex];
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        setText(currentWord.slice(0, text.length + 1));
        if (text.length + 1 === currentWord.length) setTimeout(() => setIsDeleting(true), 1500);
      } else {
        setText(currentWord.slice(0, text.length - 1));
        if (text.length === 0) { setIsDeleting(false); setWordIndex((p) => (p + 1) % typingWords.length); }
      }
    }, isDeleting ? 40 : 80);
    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex]);

  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden pt-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#0a0a0a]" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0a0a0a] to-[#0a0a0a]" />
        <div className="absolute left-1/4 top-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-[140px] animate-float" />
        <div className="absolute right-1/4 bottom-1/4 h-[400px] w-[400px] rounded-full bg-emerald-glow/5 blur-[120px] animate-float-delayed" />
      </div>
      <div className="container relative z-10 mx-auto px-6 text-center">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          <h1 className="font-display text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Engineering Tomorrow's<br /><span className="text-emerald-500">Skylines with AI.</span>
          </h1>
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg text-slate-300">
          AI-powered construction planning and real-time intelligence — built for modern builders.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="mt-8 flex items-center justify-center gap-2 font-display text-base text-primary">
          <span className="text-slate-300 text-sm">Powered by</span>
          <span className="min-w-[260px] text-left text-emerald-400 font-semibold">{text}<span className="ml-0.5 inline-block h-5 w-0.5 animate-pulse bg-emerald-400" /></span>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            onClick={() => onLaunch?.()}
            size="lg" className="glow-emerald group rounded-full bg-emerald-500 px-8 py-6 font-display text-sm font-semibold tracking-wider text-white hover:bg-emerald-600">
            Explore Platform<ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" size={18} />
          </Button>
        </motion.div>
        <div className="pointer-events-none absolute -right-20 top-20 h-32 w-32 rounded-2xl border border-primary/10 bg-gradient-to-br from-emerald/5 to-emerald-glow/5 animate-float opacity-50 blur-sm" />
        <div className="pointer-events-none absolute -left-10 bottom-32 h-24 w-24 rounded-full border border-accent/10 bg-gradient-to-br from-emerald-glow/5 to-emerald/5 animate-float-delayed opacity-30 blur-sm" />
      </div>
    </section>
  );
};

export default HeroSection;
