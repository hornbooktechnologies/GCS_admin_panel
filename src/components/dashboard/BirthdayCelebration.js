import React, { useEffect } from "react";
import { useAuthStore } from "../../context/AuthContext";
import { X, Cake } from "lucide-react";

const BirthdayCelebration = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 12000); // Auto close after 12 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none">
      {/* Darkened Backdrop */}
      <div className="absolute inset-0 bg-black/70 transition-opacity duration-1000 animate-in fade-in" />

      {/* Balloons Container */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <div className="balloon b1"></div>
        <div className="balloon b2"></div>
        <div className="balloon b3"></div>
        <div className="balloon b4"></div>
        <div className="balloon b5"></div>
      </div>

      {/* Fireworks Container */}
      <div className="absolute inset-0 w-full h-full">
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
        <div className="firework"></div>
      </div>

      <style>{`
        /* Balloon Animations */
        .balloon {
          position: absolute;
          bottom: -100px;
          width: 60px;
          height: 80px;
          background-color: #ff5e5e;
          border-radius: 50%;
          border-radius: 50% 50% 50% 50% / 40% 40% 60% 60%;
          animation: floatUp 8s ease-in infinite;
          opacity: 0.9;
          box-shadow: inset -10px -10px 20px rgba(0,0,0,0.1);
        }
        .balloon::before {
          content: "";
          position: absolute;
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 8px solid transparent;
          border-right: 8px solid transparent;
          border-top: 12px solid #ff5e5e;
        }
        .balloon::after {
          content: "";
          position: absolute;
          bottom: -40px;
          left: 50%;
          transform: translateX(-50%);
          width: 2px;
          height: 40px;
          background: rgba(255,255,255,0.7);
        }
        
        .b1 { left: 10%; background-color: #ff5e5e; animation-duration: 9s; animation-delay: 0s; } .b1::before { border-top-color: #ff5e5e; }
        .b2 { left: 30%; background-color: #42f5f5; animation-duration: 7s; animation-delay: 2s; } .b2::before { border-top-color: #42f5f5; }
        .b3 { left: 50%; background-color: #f5f542; animation-duration: 10s; animation-delay: 1s; } .b3::before { border-top-color: #f5f542; }
        .b4 { left: 70%; background-color: #ff85e8; animation-duration: 8s; animation-delay: 3s; } .b4::before { border-top-color: #ff85e8; }
        .b5 { left: 90%; background-color: #a8ffa8; animation-duration: 9.5s; animation-delay: 0.5s; } .b5::before { border-top-color: #a8ffa8; }

        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(-120vh) rotate(360deg); opacity: 0; }
        }

        /* Firework Animations */
        @keyframes firework {
          0% { transform: translate(var(--x), var(--initialY)); width: var(--initialSize); opacity: 1; }
          50% { width: 0.5vmin; opacity: 1; }
          100% { width: var(--finalSize); opacity: 0; }
        }
        .firework, .firework::before, .firework::after {
          --initialSize: 0.5vmin;
          --finalSize: 45vmin;
          --particleSize: 0.2vmin;
          --color1: yellow; --color2: khaki; --color3: white; --color4: lime; --color5: gold; --color6: mediumseagreen;
          --y: -30vmin; --x: -50%; --initialY: 60vmin;
          content: "";
          animation: firework 2s infinite;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, var(--y));
          width: var(--initialSize);
          aspect-ratio: 1;
          background: 
            radial-gradient(circle, var(--color1) var(--particleSize), #0000 0) 50% 0%,
            radial-gradient(circle, var(--color2) var(--particleSize), #0000 0) 100% 50%,
            radial-gradient(circle, var(--color3) var(--particleSize), #0000 0) 50% 100%,
            radial-gradient(circle, var(--color4) var(--particleSize), #0000 0) 0% 50%,
            radial-gradient(circle, var(--color5) var(--particleSize), #0000 0) 80% 90%,
            radial-gradient(circle, var(--color6) var(--particleSize), #0000 0) 95% 90%;
          background-size: var(--initialSize) var(--initialSize);
          background-repeat: no-repeat;
        }
        .firework::before { --x: -50%; --y: -50%; --initialY: -50%; transform: translate(-50%, -50%) rotate(40deg) scale(1.3) rotateY(40deg); }
        .firework::after { --x: -50%; --y: -50%; --initialY: -50%; transform: translate(-50%, -50%) rotate(170deg) scale(1.15) rotateY(-30deg); }
        
        .firework:nth-child(2) { --x: 30vmin; --initialY: 40vmin; --finalSize: 40vmin;  animation-delay: -0.25s; }
        .firework:nth-child(3) { --x: -30vmin; --initialY: 20vmin; --finalSize: 35vmin; animation-delay: -0.4s; }
        .firework:nth-child(4) { --x: 10vmin; --initialY: 50vmin; --finalSize: 50vmin; animation-delay: -0.6s; }
        .firework:nth-child(5) { --x: -20vmin; --initialY: 30vmin; --finalSize: 40vmin; animation-delay: -0.8s; }
      `}</style>

      <div className="relative z-10 flex flex-col items-center justify-center pointer-events-auto animate-in zoom-in slide-in-from-bottom-10 duration-1000">
        <div className="mb-6 animate-bounce duration-[2000ms]">
          <Cake className="w-24 h-24 text-pink-400 drop-shadow-[0_0_15px_rgba(255,105,180,0.8)]" />
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-500 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] tracking-tighter text-center leading-tight mb-4">
          Happy<br />Birthday!
        </h1>
        <h2 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md tracking-wide">
          {user?.first_name} {user?.last_name}
        </h2>

        <button
          onClick={onClose}
          className="mt-12 p-3 bg-white/10 hover:bg-white/30 rounded-full text-white backdrop-blur-sm transition-all border border-white/20"
        >
          <X className="w-8 h-8" />
          <span className="sr-only">Close</span>
        </button>
      </div>
    </div>
  );
};

export default BirthdayCelebration;
