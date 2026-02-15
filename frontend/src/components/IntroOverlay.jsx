import React, { useEffect, useState } from 'react';

const IntroOverlay = ({ onComplete }) => {
    const [stage, setStage] = useState(0); // 1, 2, 3, 4
    const [closing, setClosing] = useState(false);

    useEffect(() => {
        // Stage 1: Dark Cinematic Intro (0-1.5s)
        const s1 = setTimeout(() => setStage(1), 100);

        // Stage 2: Intelligence Activation (1.5-3s)
        const s2 = setTimeout(() => setStage(2), 1500);

        // Stage 3: Data Flow Effect (3-4s)
        const s3 = setTimeout(() => setStage(3), 3000);

        // Stage 4: Transition to Dashboard (4-6s)
        const s4 = setTimeout(() => {
            setClosing(true);
            setTimeout(onComplete, 1000);
        }, 5000);

        return () => {
            [s1, s2, s3, s4].forEach(clearTimeout);
        };
    }, [onComplete]);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            background: '#0a0f1d',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            overflow: 'hidden',
            opacity: closing ? 0 : 1,
            transform: closing ? 'scale(1.1)' : 'scale(1)',
            transition: 'opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1)',
            fontFamily: "'Outfit', sans-serif"
        }}>
            {/* Background Grid - Animated subtly */}
            <div style={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'linear-gradient(rgba(0, 234, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 234, 255, 0.05) 1px, transparent 1px)',
                backgroundSize: '60px 60px',
                opacity: stage >= 2 ? 0.4 : 0,
                transition: 'opacity 2s ease-in-out',
                transform: 'perspective(1000px) rotateX(60deg) translateY(-100px) translateZ(0)',
                transformOrigin: 'top center'
            }}></div>

            {/* Central Stage */}
            <div style={{
                position: 'relative',
                width: '400px',
                height: '400px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                perspective: '1200px'
            }}>
                {/* Stage 1-2: Wireframe Building */}
                <div style={{
                    width: '180px',
                    height: '180px',
                    position: 'relative',
                    transformStyle: 'preserve-3d',
                    transform: stage >= 2 ? 'rotateY(45deg) rotateX(-15deg)' : 'rotateY(0) rotateX(0)',
                    transition: 'transform 2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    opacity: stage >= 1 ? 1 : 0
                }}>
                    {/* Building Outline SVG */}
                    <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                        <path
                            d="M 20,80 L 20,40 L 50,20 L 80,40 L 80,80 L 20,80 M 20,40 L 80,40 M 50,20 L 50,80"
                            fill="none"
                            stroke="#00eaff"
                            strokeWidth="0.5"
                            className="building-path"
                            style={{
                                strokeDasharray: 1000,
                                strokeDashoffset: stage >= 1 ? 0 : 1000,
                                transition: 'stroke-dashoffset 1.5s ease-out',
                                filter: 'drop-shadow(0 0 5px rgba(0, 234, 255, 0.5))'
                            }}
                        />
                        {/* Floor Segments Reveal */}
                        {stage >= 2 && (
                            <g opacity="0.4">
                                <line x1="20" y1="60" x2="80" y2="60" stroke="#00eaff" strokeWidth="0.2" />
                                <line x1="20" y1="50" x2="80" y2="50" stroke="#00eaff" strokeWidth="0.2" />
                            </g>
                        )}
                    </svg>

                    {/* Stage 3: Light Particles (Data Flow) */}
                    {stage >= 3 && (
                        <div className="data-flow-container" style={{ position: 'absolute', inset: 0 }}>
                            <div className="particle" style={{ left: '20%', top: '80%', animationDelay: '0s' }}></div>
                            <div className="particle" style={{ left: '50%', top: '20%', animationDelay: '0.4s' }}></div>
                            <div className="particle" style={{ left: '80%', top: '80%', animationDelay: '0.8s' }}></div>
                        </div>
                    )}
                </div>

                {/* Brand Text */}
                <div style={{
                    position: 'absolute',
                    bottom: '-60px',
                    width: '100%',
                    textAlign: 'center',
                    opacity: stage >= 2 ? 1 : 0,
                    transform: `translateY(${stage >= 2 ? '0' : '20px'})`,
                    transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1)'
                }}>
                    <h1 style={{
                        color: 'white',
                        fontSize: '36px',
                        fontWeight: 900,
                        margin: 0,
                        letterSpacing: '8px',
                        textTransform: 'uppercase',
                        background: 'linear-gradient(to bottom, #fff, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}>CONSTRUCTIQ</h1>

                    <div style={{
                        color: '#00eaff',
                        fontSize: '11px',
                        fontWeight: 700,
                        letterSpacing: '3px',
                        marginTop: '8px',
                        opacity: 0.8,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                        <div style={{ width: '20px', height: '1px', background: 'rgba(0, 234, 255, 0.3)' }}></div>
                        AI-POWERED CONSTRUCTION INTELLIGENCE
                        <div style={{ width: '20px', height: '1px', background: 'rgba(0, 234, 255, 0.3)' }}></div>
                    </div>
                </div>
            </div>

            {/* Tagline Reveal */}
            <div style={{
                position: 'absolute',
                bottom: '100px',
                display: 'flex',
                gap: '40px',
                opacity: stage >= 3 ? 1 : 0,
                transform: `translateY(${stage >= 3 ? '0' : '10px'})`,
                transition: 'all 0.8s ease-out'
            }}>
                {['Planning', 'Estimation', 'Intelligence'].map((text, i) => (
                    <div key={i} style={{
                        color: 'white',
                        fontSize: '14px',
                        fontWeight: 500,
                        letterSpacing: '2px',
                        opacity: 0.6,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}>
                        <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#3b82f6' }}></div>
                        {text}
                    </div>
                ))}
            </div>

            {/* Version Display */}
            <div style={{
                position: 'absolute',
                top: '40px',
                right: '40px',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '10px',
                fontWeight: 800,
                letterSpacing: '1px'
            }}>
                V4.0 PREMIUM BUILD
            </div>

            <style>{`
                .particle {
                    position: absolute;
                    width: 4px;
                    height: 4px;
                    background: #00eaff;
                    border-radius: 50%;
                    box-shadow: 0 0 10px #00eaff;
                    animation: dataFlow 2s linear infinite;
                }
                @keyframes dataFlow {
                    0% { transform: scale(0) translateZ(0); opacity: 0; }
                    50% { transform: scale(1.5) translateZ(50px); opacity: 1; }
                    100% { transform: scale(0) translateZ(100px); opacity: 0; }
                }
                .building-path {
                    filter: drop-shadow(0 0 8px rgba(0, 234, 255, 0.4));
                }
            `}</style>
        </div>
    );
};

export default IntroOverlay;
