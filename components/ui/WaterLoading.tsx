"use client";

import { AnimatePresence, motion } from "framer-motion";

interface WaterLoadingProps {
  isLoading: boolean;
}

export default function WaterLoading({ isLoading }: WaterLoadingProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white dark:bg-neutral-950"
        >
          <style>{`
            @keyframes fillRise {
              0% { transform: translateY(130px); }
              100% { transform: translateY(0px); }
            }
            @keyframes wave1 {
              0%, 100% { transform: translateX(0px); }
              25% { transform: translateX(4px); }
              75% { transform: translateX(-4px); }
            }
            @keyframes wave2 {
              0%, 100% { transform: translateX(0px); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }
            .water-body {
              animation: fillRise 1.4s ease-in-out forwards;
            }
            .wave-surface-1 {
              animation: wave1 1.2s ease-in-out infinite;
            }
            .wave-surface-2 {
              animation: wave2 0.9s ease-in-out infinite;
            }
          `}</style>
          <svg
            viewBox="0 0 300 400"
            className="w-[180px] h-auto sm:w-[220px]"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <clipPath id="waterClip">
                <circle cx="150" cy="180" r="65" />
              </clipPath>
              <linearGradient id="waterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f48221" stopOpacity="0.95" />
                <stop offset="50%" stopColor="#f48221" stopOpacity="0.75" />
                <stop offset="100%" stopColor="#f48221" stopOpacity="0.3" />
              </linearGradient>
            </defs>

            <polygon
              points="30,100 150,30 270,100 270,120 150,50 30,120"
              fill="#f48221"
            />

            <polygon
              points="210,115 235,95 255,115 230,135"
              fill="#1d1d1b"
            />

            <circle
              cx="150"
              cy="180"
              r="65"
              fill="none"
              stroke="#1d1d1b"
              strokeWidth="18"
            />

            <g clipPath="url(#waterClip)">
              <g className="water-body">
                <rect
                  x="78"
                  y="110"
                  width="144"
                  height="140"
                  fill="url(#waterGrad)"
                />

                <path
                  className="wave-surface-1"
                  d="M 65 125 Q 95 112 125 125 T 185 125 T 245 125 L 245 148 L 65 148 Z"
                  fill="#f48221"
                  opacity="0.85"
                />

                <path
                  className="wave-surface-2"
                  d="M 62 115 Q 94 104 128 115 T 192 115 T 248 115 L 248 138 L 62 138 Z"
                  fill="#f48221"
                  opacity="0.95"
                />
              </g>
            </g>

            <text
              x="150"
              y="228"
              fontFamily="Arial, sans-serif"
              fontWeight="900"
              fontSize="130"
              textAnchor="middle"
              fill="#1d1d1b"
            >
              S
            </text>

            <g fill="#f48221">
              <text
                x="150"
                y="325"
                fontFamily="'Arial Black', Impact, sans-serif"
                fontWeight="900"
                fontSize="95"
                textAnchor="middle"
                letterSpacing="1"
              >
                ONE
              </text>
              <rect x="73" y="240" width="6" height="90" fill="#ffffff" />
              <rect
                x="135"
                y="240"
                width="6"
                height="90"
                fill="#ffffff"
                transform="skewX(-25)"
              />
              <rect x="228" y="240" width="8" height="90" fill="#ffffff" />
            </g>

            <text
              x="150"
              y="375"
              fontFamily="Arial, sans-serif"
              fontWeight="900"
              fontSize="36"
              textAnchor="middle"
              className="fill-black dark:fill-white"
              letterSpacing="2"
            >
              SOLUTIONS
            </text>
          </svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
