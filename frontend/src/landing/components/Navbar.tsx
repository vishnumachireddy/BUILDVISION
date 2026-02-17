import { useState, useEffect } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";


const Navbar = () => {
  const [isDark, setIsDark] = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);
  useEffect(() => {
    const container = document.getElementById("landing-scroll-container");
    const onScroll = () => {
      if (container) setIsScrolled(container.scrollTop > 20);
    };
    if (container) container.addEventListener("scroll", onScroll);
    return () => {
      if (container) container.removeEventListener("scroll", onScroll);
    };
  }, []);

  const toggleTheme = () => { setIsDark(!isDark); document.documentElement.classList.toggle("dark"); };

  const scrollToSection = (id: string) => {
    const container = document.getElementById("landing-scroll-container");
    const element = document.getElementById(id);
    if (container && element) {
      const top = element.getBoundingClientRect().top + container.scrollTop - container.getBoundingClientRect().top - 80;
      container.scrollTo({ top, behavior: "smooth" });
    }
  };

  const links = [
    { label: "Home", href: "#", action: () => document.getElementById("landing-scroll-container")?.scrollTo({ top: 0, behavior: "smooth" }) },
    { label: "About", href: "#about", action: () => scrollToSection("about") },
    { label: "Services", href: "#services", action: () => scrollToSection("services") },
    { label: "Contact", href: "#footer", action: () => scrollToSection("footer") },
  ];

  return (
    <motion.nav initial={{ y: -100 }} animate={{ y: 0 }} transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${isScrolled ? "glass shadow-lg" : "bg-transparent"}`}>
      <div className="container mx-auto flex items-center justify-between px-6 py-4">
        <a href="#" className="shimmer-hover rounded-lg px-2 py-1 font-display text-xl tracking-wider">
          <span className="font-bold text-white">BUILD</span>
          <span className="text-gradient font-bold">VISION</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={(e) => { if (l.action) { e.preventDefault(); l.action(); } }}
              className="text-sm font-medium text-slate-300 transition-colors hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <button onClick={toggleTheme} className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground" aria-label="Toggle theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
        <button className="md:hidden text-foreground p-2" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="glass md:hidden overflow-hidden">
            <div className="flex flex-col gap-4 px-6 py-6">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={(e) => {
                    setMobileOpen(false);
                    if (l.action) { e.preventDefault(); l.action(); }
                  }}
                  className="text-sm font-medium text-slate-300 hover:text-white"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex items-center gap-4">
                <button onClick={toggleTheme} className="rounded-full p-2 text-muted-foreground hover:text-foreground">{isDark ? <Sun size={18} /> : <Moon size={18} />}</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
