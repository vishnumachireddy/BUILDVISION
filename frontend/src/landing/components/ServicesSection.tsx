import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, BarChart3, ShieldCheck } from "lucide-react";

const services = [
  {
    icon: Brain,
    title: "AI Project Planning",
    description: "Smart scheduling and resource optimization.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Live dashboards. Instant visibility.",
  },
  {
    icon: ShieldCheck,
    title: "Risk & Cost Prediction",
    description: "Forecast delays and budget overruns before they happen.",
  },
];

const ServicesSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="services" className="relative py-24 sm:py-32">
      <div className="container mx-auto px-6" ref={ref}>
        <motion.div initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center">
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-emerald-500">What We Offer</p>
          <h2 className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            Our Core <span className="text-emerald-500">Intelligence</span>
          </h2>
        </motion.div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {services.map((service, i) => {
            const Icon = service.icon;
            return (
              <motion.div key={service.title} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 + i * 0.15 }}
                className="glass-card glow-border group rounded-2xl p-8 transition-transform duration-300 hover:-translate-y-2">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 transition-colors group-hover:bg-emerald-500/20">
                  <Icon size={28} />
                </div>
                <h3 className="font-display text-lg font-bold text-white">{service.title}</h3>
                <p className="mt-3 leading-relaxed text-slate-300 text-sm">{service.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
