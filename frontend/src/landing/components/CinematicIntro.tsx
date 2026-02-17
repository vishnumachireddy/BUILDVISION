import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import buildvisionBg from "@/landing/assets/buildvision-bg.png";
const fallbackBg = "/images/buildvision-bg.png";

const tagline = "Engineering Tomorrow's Skylines with Artificial Intelligence.";

const CinematicIntro = ({ onComplete }: { onComplete: () => void }) => {
  const [phase, setPhase] = useState<"dark" | "glow" | "reveal" | "tagline" | "exit">("dark");
  const [taglineText, setTaglineText] = useState("");
  const completedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase("exit");
    setTimeout(onComplete, 1000);
  }, [onComplete]);

  // Particle system
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; pulse: number }> = [];
    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -(Math.random() * 0.4 + 0.1),
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = Date.now() * 0.001;
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.pulse += 0.02;
        if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        const flicker = Math.sin(p.pulse) * 0.3 + 0.7;
        const a = p.alpha * flicker;

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 200, 255, ${a * 0.15})`;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(100, 220, 255, ${a})`;
        ctx.fill();
      });

      // Horizontal scan line
      const scanY = (Math.sin(time * 0.5) * 0.5 + 0.5) * canvas.height;
      const grad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      grad.addColorStop(0, "rgba(0, 200, 255, 0)");
      grad.addColorStop(0.5, "rgba(0, 200, 255, 0.06)");
      grad.addColorStop(1, "rgba(0, 200, 255, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, scanY - 30, canvas.width, 60);

      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { window.removeEventListener("resize", resize); cancelAnimationFrame(animId); };
  }, []);

  // Timeline
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase("glow"), 600),
      setTimeout(() => setPhase("reveal"), 1800),
      setTimeout(() => setPhase("tagline"), 3200),
      setTimeout(() => finish(), 7000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [finish]);

  // Typewriter
  useEffect(() => {
    if (phase !== "tagline") return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setTaglineText(tagline.slice(0, i));
      if (i >= tagline.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [phase]);

  return (
    <AnimatePresence>
      {phase !== "exit" ? (
        <motion.div
          key="intro"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(16px)", scale: 1.05 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center overflow-hidden"
          style={{ background: "#060a0e" }}
          onClick={finish}
        >
          {/* Particle canvas */}
          <canvas ref={canvasRef} className="absolute inset-0 z-[2] pointer-events-none" />

          {/* Deep ambient glow - pulse */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={phase !== "dark" ? { opacity: [0, 0.4, 0.2, 0.5, 0.3] } : {}}
            transition={{ duration: 4, ease: "easeInOut", repeat: Infinity, repeatType: "mirror" }}
            className="absolute inset-0 z-[1]"
            style={{
              background: "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0, 150, 255, 0.08), transparent 70%)",
            }}
          />

          {/* Secondary purple glow */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={phase !== "dark" ? { opacity: [0, 0.3, 0.15, 0.35] } : {}}
            transition={{ duration: 5, ease: "easeInOut", repeat: Infinity, repeatType: "mirror", delay: 1 }}
            className="absolute inset-0 z-[1]"
            style={{
              background: "radial-gradient(ellipse 40% 40% at 60% 45%, rgba(160, 80, 255, 0.06), transparent 70%)",
            }}
          />

          {/* Vignette overlay */}
          <div
            className="absolute inset-0 z-[3] pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(0,0,0,0.7) 100%)",
            }}
          />

          {/* Background image with cinematic zoom reveal */}
          <motion.img
            src={buildvisionBg || fallbackBg}
            onError={(e) => { (e.target as HTMLImageElement).src = fallbackBg; }}
            alt=""
            initial={{ opacity: 0, scale: 1.2, filter: "blur(20px) brightness(0.3)" }}
            animate={
              phase === "glow"
                ? { opacity: 0.4, scale: 1.15, filter: "blur(10px) brightness(0.5)" }
                : phase === "reveal" || phase === "tagline"
                  ? { opacity: 1, scale: 1, filter: "blur(0px) brightness(1)" }
                  : {}
            }
            transition={{ duration: 2.5, ease: [0.25, 0.1, 0.25, 1] }}
            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-[1]"
          />

          {/* Horizontal light flare */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={
              phase === "reveal" || phase === "tagline"
                ? { opacity: [0, 0.8, 0.4], scaleX: [0, 1.2, 1] }
                : {}
            }
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            className="absolute z-[4] h-[2px] w-[80%] max-w-2xl"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(0, 200, 255, 0.6), rgba(255, 255, 255, 0.8), rgba(0, 200, 255, 0.6), transparent)",
              boxShadow: "0 0 30px 10px rgba(0, 200, 255, 0.15)",
            }}
          />

          {/* Tagline typewriter */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={phase === "tagline" ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="relative z-[5] mt-32 sm:mt-40 max-w-lg px-6 text-center font-body text-base tracking-[0.15em] sm:text-lg"
            style={{ color: "hsla(200, 30%, 88%, 0.95)", textShadow: "0 0 20px rgba(0, 180, 255, 0.3)" }}
          >
            {taglineText}
            {phase === "tagline" && taglineText.length < tagline.length && (
              <span
                className="ml-0.5 inline-block h-5 w-[2px] animate-pulse"
                style={{ background: "hsl(190, 100%, 60%)", boxShadow: "0 0 8px hsl(190, 100%, 60%)" }}
              />
            )}
          </motion.p>

          {/* Skip hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={phase !== "dark" ? { opacity: 0.35 } : {}}
            transition={{ delay: 2.5, duration: 1 }}
            className="absolute bottom-8 z-[5] text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "hsla(200, 15%, 55%, 0.5)" }}
          >
            Click anywhere to skip
          </motion.p>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default CinematicIntro;
