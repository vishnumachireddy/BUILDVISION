import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Zap, TrendingUp, Shield } from "lucide-react";

const stats = [
  { value: "98%", label: "Project Accuracy" },
  { value: "3×", label: "Faster Planning" },
  { value: "40%", label: "Cost Reduction" },
  { value: "500+", label: "Projects Optimized" },
];

const AboutSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="about" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-6" ref={ref}>
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7 }}>
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">About BuildVision</p>
            <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-white sm:text-4xl">
              Redefining Construction<br /><span className="text-gradient">with Intelligence</span>
            </h2>
            <p className="mt-6 text-base leading-relaxed text-slate-300">
              BuildVision combines AI, data analytics, and predictive insights to help teams build faster, smarter, and more efficiently.
            </p>
            <div className="mt-8 flex gap-6">
              {[
                { icon: Zap, text: "AI-Powered" },
                { icon: TrendingUp, text: "Data-Driven" },
                { icon: Shield, text: "Enterprise-Ready" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-sm text-slate-300">
                  <Icon size={16} className="text-emerald-500" />{text}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 40 }} animate={isInView ? { opacity: 1, x: 0 } : {}} transition={{ duration: 0.7, delay: 0.2 }}
            className="glass-card glow-border rounded-2xl p-8 sm:p-10">
            <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">Platform Impact</p>
            <div className="mt-8 grid grid-cols-2 gap-8">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }} className="text-center">
                  <div className="font-display text-3xl font-bold text-gradient sm:text-4xl">{stat.value}</div>
                  <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
