import { Linkedin, Twitter, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer id="footer" className="relative border-t border-border/50 py-12">
      {/* Gradient top border accent */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="container mx-auto flex flex-col items-center gap-6 px-6 sm:flex-row sm:justify-between">
        {/* Logo */}
        <a href="#" className="font-display text-lg tracking-wider">
          <span className="font-bold text-white">BUILD</span>
          <span className="text-gradient font-bold">VISION</span>
        </a>

        {/* Social icons */}
        <div className="flex gap-4">
          {[
            { icon: Linkedin, label: "LinkedIn" },
            { icon: Twitter, label: "Twitter" },
            { icon: Github, label: "GitHub" },
          ].map(({ icon: Icon, label }) => (
            <a
              key={label}
              href="#"
              aria-label={label}
              className="rounded-full p-2 text-slate-400 transition-colors hover:text-white"
            >
              <Icon size={18} />
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-sm text-slate-400">
          © {new Date().getFullYear()} BuildVision. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
