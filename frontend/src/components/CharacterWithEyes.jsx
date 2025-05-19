"use client";

import { useState, useEffect } from "react";

export default function CharacterWithEyes() {
    const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
    const [isLocked, setIsLocked] = useState(true);
    const [isHovering, setIsHovering] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e) => {
            // Calculate mouse position relative to character
            const keyhole = document.getElementById('keyhole-circle');
            if (!keyhole) return;

            const rect = keyhole.getBoundingClientRect();
            const keyholeX = rect.left + rect.width / 2;
            const keyholeY = rect.top + rect.height / 2;

            // Calculate angle between mouse and keyhole
            const deltaX = e.clientX - keyholeX;
            const deltaY = e.clientY - keyholeY;

            // Limit movement range
            const maxMove = 2.5;
            const distance = Math.max(1, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
            const normalizedX = deltaX / distance;
            const normalizedY = deltaY / distance;

            setEyePosition({
                x: normalizedX * maxMove,
                y: normalizedY * maxMove
            });
        };

        window.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    const handleClick = () => {
        setIsLocked(!isLocked);
        // Reset after 2 seconds
        setTimeout(() => setIsLocked(true), 2000);
    };

    return (
        <>
            <style dangerouslySetInnerHTML={{
                __html: `
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.95; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.03); }
        }
        @keyframes unlock {
          0% { transform: translateY(0); }
          40% { transform: translateY(-12px); }
          60% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
        @keyframes highlight {
          0% { filter: brightness(1); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
          50% { filter: brightness(1.15); box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2); }
          100% { filter: brightness(1); box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15); }
        }
      `}} />

            <div
                className="w-36 h-36 flex items-center justify-center relative mb-2 cursor-pointer"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={handleClick}
            >
                {/* Modern lock icon */}
                <div
                    className={`relative transition-all duration-300`}
                    style={{
                        animation: isHovering
                            ? "pulse 2s infinite ease-in-out"
                            : "float 4s infinite ease-in-out",
                        filter: `drop-shadow(0 5px 15px rgba(0, 0, 0, 0.2))`
                    }}
                >
                    {/* Lock body */}
                    <div
                        className={`w-24 h-28 bg-gradient-to-br transition-all duration-300 rounded-2xl flex items-center justify-center
              ${isHovering ? 'from-zinc-700 to-zinc-900' : 'from-zinc-600 to-zinc-800'}`}
                        style={{
                            animation: isHovering ? 'highlight 2s infinite ease-in-out' : '',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)'
                        }}
                    >
                        {/* Keyhole outer */}
                        <div className={`w-8 h-12 bg-zinc-500/20 rounded-lg overflow-hidden transition-all duration-300
              ${isLocked ? 'opacity-100' : 'opacity-50'}`}>

                            {/* Keyhole circle that follows cursor */}
                            <div
                                id="keyhole-circle"
                                className="w-5 h-5 bg-zinc-400/30 rounded-full mx-auto mt-2 relative"
                                style={{
                                    transform: `translate(${eyePosition.x * 2}px, ${eyePosition.y * 2}px)`,
                                    transition: 'transform 0.15s ease-out'
                                }}
                            >
                                {/* Keyhole inner slot */}
                                <div className="absolute w-1 h-3 bg-zinc-800 bottom-0 left-1/2 transform -translate-x-1/2"></div>
                            </div>
                        </div>
                    </div>

                    {/* Lock shackle */}
                    <div
                        className="absolute"
                        style={{
                            // 크기
                            width: '60px',
                            height: '20px',
                            // 위쪽 U자 형태만 남기기
                            border: '6px solid #475569',
                            borderBottom: 'none',
                            borderRadius: '40px 40px 0 0',
                            // 위치
                            left: '50%',          // 부모 가로 가운데
                            top: '-20px',          // 살짝 위로 올려서 바디랑 겹치게
                            transformOrigin: 'bottom center',
                            // 애니메이션
                            transition: 'transform 0.6s ease-in-out',
                            transform: isLocked
                                ? 'translateX(-50%) rotate(0deg)'
                                : 'translateX(-50%) translateY(-6px) rotate(-15deg)',
                        }}
                    />


                </div>
            </div>
        </>
    );
} 