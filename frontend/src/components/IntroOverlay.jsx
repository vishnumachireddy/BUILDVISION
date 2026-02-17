import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, Box, Cpu, Globe, Rocket } from 'lucide-react';

const IntroOverlay = ({ onComplete }) => {
    const [mounted, setMounted] = useState(false);
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleStart = () => {
        setClosing(true);
        setTimeout(onComplete, 1200);
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#040712',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: closing ? 0 : 1,
            transform: closing ? 'scale(1.05)' : 'scale(1)',
            transition: 'opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Outfit', sans-serif",
            color: 'white'
        }}>
            {/* Background Aesthetic Elements */}
            <div style={{
                position: 'absolute',
                top: '-10%',
                left: '-10%',
                width: '120%',
                height: '120%',
                background: 'radial-gradient(circle at center, rgba(0, 234, 255, 0.1) 0%, transparent 70%)',
                opacity: mounted ? 0.6 : 0,
                transition: 'opacity 3s ease'
            }} />

            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0, 234, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 234, 255, 0.03) 1px, transparent 1px)',
                backgroundSize: '100px 100px',
                opacity: mounted ? 0.5 : 0,
                transition: 'opacity 2s ease-in-out',
                transform: 'perspective(1500px) rotateX(70deg) translateY(-200px)',
                transformOrigin: 'top center'
            }} />

            {/* Content Container */}
            <div style={{
                position: 'relative',
                maxWidth: '1200px',
                width: '100%',
                padding: '0 40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                zIndex: 10
            }}>
                {/* Left Side: Text Content */}
                <div style={{
                    width: '50%',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateX(0)' : 'translateX(-40px)',
                    transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <div style={{ width: 40, height: 2, background: '#00eaff' }}></div>
                        <span style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '4px', color: '#00eaff', textTransform: 'uppercase' }}>
                            Next-Gen Architectural Intelligence
                        </span>
                    </div>

                    <h1 style={{
                        fontSize: '84px',
                        fontWeight: 900,
                        margin: '0 0 24px',
                        lineHeight: '0.9',
                        letterSpacing: '-2px',
                        background: 'linear-gradient(to bottom right, #fff 40%, #94a3b8 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>
                        Construct<span style={{ color: '#00eaff', WebkitTextFillColor: '#00eaff' }}>IQ</span><br />
                        Engineering.
                    </h1>

                    <p style={{
                        fontSize: '20px',
                        color: '#94a3b8',
                        maxWidth: '500px',
                        lineHeight: '1.6',
                        marginBottom: '48px',
                        fontWeight: 500
                    }}>
                        Synthesizing satellite precision, regional soil intelligence, and AI-driven spatial planning into a unified 3D ecosystem.
                    </p>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <button
                            onClick={handleStart}
                            onMouseEnter={e => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 234, 255, 0.3)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 234, 255, 0.2)';
                            }}
                            style={{
                                padding: '20px 48px',
                                borderRadius: '20px',
                                background: '#00eaff',
                                color: '#040712',
                                border: 'none',
                                fontSize: '18px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                boxShadow: '0 10px 30px rgba(0, 234, 255, 0.2)'
                            }}
                        >
                            <Rocket size={20} /> LAUNCH WORKSPACE <ArrowRight size={20} />
                        </button>
                    </div>

                    {/* Features Row */}
                    <div style={{
                        marginTop: '80px',
                        display: 'flex',
                        gap: '60px',
                        opacity: mounted ? 0.6 : 0,
                        transition: 'opacity 2s ease 0.5s'
                    }}>
                        {[
                            { icon: Globe, label: 'Global Terrain' },
                            { icon: Cpu, label: 'AI Synthesis' },
                            { icon: Box, label: 'Real-time 3D' }
                        ].map((f, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <f.icon size={18} color="#00eaff" />
                                <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', textTransform: 'uppercase' }}>{f.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Animated 3D Wireframe Placeholder */}
                <div style={{
                    width: '40%',
                    height: '600px',
                    position: 'relative',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'scale(1) rotateY(-10deg)' : 'scale(0.9) rotateY(0)',
                    transition: 'all 1.5s cubic-bezier(0.22, 1, 0.36, 1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <div className="hero-building-visual" style={{
                        width: '100%',
                        height: '100%',
                        position: 'relative',
                        transformStyle: 'preserve-3d'
                    }}>
                        {/* Central Glowing Core */}
                        <div style={{
                            position: 'absolute',
                            width: '200px',
                            height: '200px',
                            background: 'radial-gradient(circle, #00eaff 0%, transparent 70%)',
                            filter: 'blur(30px)',
                            opacity: 0.3,
                            animation: 'pulse 4s ease-in-out infinite'
                        }} />

                        {/* Animated Wireframe Elements */}
                        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', filter: 'drop-shadow(0 0 15px rgba(0, 234, 255, 0.4))' }}>
                            <rect x="25" y="40" width="50" height="40" fill="none" stroke="#00eaff" strokeWidth="0.5" strokeDasharray="200" style={{ animation: 'draw 4s ease-out infinite' }} />
                            <path d="M 25,40 L 50,20 L 75,40" fill="none" stroke="#00eaff" strokeWidth="0.5" strokeDasharray="100" style={{ animation: 'draw 4s ease-out infinite 0.5s' }} />
                            <line x1="25" y1="55" x2="75" y2="55" stroke="rgba(0, 234, 255, 0.2)" strokeWidth="0.1" />
                            <line x1="25" y1="70" x2="75" y2="70" stroke="rgba(0, 234, 255, 0.2)" strokeWidth="0.1" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Version Display */}
            <div style={{
                position: 'absolute',
                bottom: '40px',
                right: '40px',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '2px'
            }}>
                CONSTRUCTIQ V4.2.0 CORE // PREMIUM_RELEASE
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% { transform: scale(1); opacity: 0.3; }
                    50% { transform: scale(1.2); opacity: 0.5; }
                }
                @keyframes draw {
                    0% { stroke-dashoffset: 200; opacity: 0; }
                    30% { opacity: 1; }
                    70% { stroke-dashoffset: 0; opacity: 1; }
                    100% { stroke-dashoffset: 0; opacity: 0; }
                }
                button:active {
                    transform: scale(0.95) !important;
                }
            `}</style>
        </div>
    );
};

export default IntroOverlay;
