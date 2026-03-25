import { motion } from "motion/react";

interface DogProps {
  hunger: number;
  isEating?: boolean;
}

export default function Dog({ hunger, isEating }: DogProps) {
  // Hunger states: 0-100 (100 is full)
  let tailSpeed = 0.5;

  if (isEating) {
    tailSpeed = 0.1;
  } else if (hunger > 70) {
    tailSpeed = 0.4;
  } else if (hunger > 30) {
    tailSpeed = 0.8;
  } else if (hunger > 10) {
    tailSpeed = 1.5;
  } else {
    tailSpeed = 3;
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-80 h-80">
        <motion.svg
          viewBox="0 0 200 200"
          className="w-full h-full"
          animate={isEating ? {
            y: [0, -2, 0],
          } : {}}
          transition={{ duration: 0.4, repeat: isEating ? Infinity : 0 }}
        >
          <defs>
            {/* Gradients for depth */}
            <linearGradient id="mainFur" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D7B19D" />
              <stop offset="100%" stopColor="#B08968" />
            </linearGradient>
            <linearGradient id="highlightFur" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F5F5F5" />
            </linearGradient>
          </defs>

          {/* Ground Shadow */}
          <ellipse cx="100" cy="192" rx="65" ry="8" fill="rgba(0,0,0,0.08)" />

          {/* Tail - Light Brown */}
          <motion.path
            d="M 145 140 Q 160 130 155 110"
            stroke="#B08968"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            animate={{ rotate: [0, 12, 0, -12, 0] }}
            transition={{ duration: tailSpeed, repeat: Infinity, ease: "easeInOut" }}
            style={{ originX: "145px", originY: "140px" }}
          />

          {/* Body - Layered Light Brown and White */}
          <g>
            {/* Main Body Shape (Light Brown) */}
            <path 
              d="M 60 130 C 50 130 45 150 50 175 C 55 190 80 190 100 190 C 125 190 150 185 150 155 C 150 125 130 110 100 110 C 75 110 70 125 60 130" 
              fill="url(#mainFur)" 
            />
            {/* White Chest/Belly Highlights */}
            <path 
              d="M 85 130 C 85 150 90 180 100 180 C 110 180 115 150 115 130 Z" 
              fill="#FFFFFF" 
              opacity="0.4"
            />
          </g>

          {/* Legs - White/Cream */}
          <g fill="#FFFFFF">
            {/* Back Legs */}
            <path d="M 55 170 Q 45 185 55 192 Q 70 192 70 180 Z" fill="#F5F5F5" />
            <path d="M 145 170 Q 155 185 145 192 Q 130 192 130 180 Z" fill="#F5F5F5" />
            
            {/* Front Legs - Prominent White */}
            <g>
              <path d="M 75 160 Q 65 185 70 195 Q 90 195 90 180 Z" fill="#FFFFFF" />
              <path d="M 125 160 Q 135 185 130 195 Q 110 195 110 180 Z" fill="#FFFFFF" />
              {/* Paw details */}
              <path d="M 70 190 Q 80 198 90 190" stroke="#D7B19D" fill="none" strokeWidth="1" />
              <path d="M 110 190 Q 120 198 130 190" stroke="#D7B19D" fill="none" strokeWidth="1" />
            </g>
          </g>

          {/* Head Group */}
          <motion.g
            animate={isEating ? { y: [0, 1.5, 0] } : {}}
            transition={{ duration: 0.3, repeat: Infinity }}
          >
            {/* Head Silhouette - Light Brown */}
            <path 
              d="M 72 55 C 72 45 85 40 100 40 C 115 40 128 45 128 55 L 128 100 C 128 115 115 122 100 122 C 85 122 72 115 72 100 Z" 
              fill="url(#mainFur)" 
            />
            
            {/* White Highlights on Head */}
            <path d="M 72 70 Q 85 65 100 65 Q 115 65 128 70 L 128 85 Q 100 90 72 85 Z" fill="#FFFFFF" opacity="0.2" />

            {/* Ears - Light Brown and folded */}
            <path d="M 72 50 L 55 75 L 80 70 Z" fill="#B08968" />
            <path d="M 128 50 L 145 75 L 120 70 Z" fill="#B08968" />

            {/* Eyebrows - Bushy, Layered White */}
            <g>
              {/* White base */}
              <path d="M 68 75 C 75 60 90 60 98 75 C 90 80 75 80 68 75" fill="#FFFFFF" />
              <path d="M 102 75 C 110 60 125 60 132 75 C 125 80 110 80 102 75" fill="#FFFFFF" />
              {/* Subtle highlights */}
              <path d="M 72 72 C 78 65 88 65 94 72" fill="#F5F5F5" opacity="0.8" />
              <path d="M 106 72 C 112 65 122 65 128 72" fill="#F5F5F5" opacity="0.8" />
            </g>

            {/* Eyes - Dark Brown with highlights */}
            <g>
              <circle cx="85" cy="82" r="6" fill="#3E2723" />
              <circle cx="83.5" cy="80.5" r="2" fill="#FFFFFF" opacity="0.9" />
              <circle cx="115" cy="82" r="6" fill="#3E2723" />
              <circle cx="113.5" cy="80.5" r="2" fill="#FFFFFF" opacity="0.9" />
            </g>

            {/* Beard/Muzzle - Pure White, layered */}
            <g>
              {/* White base */}
              <path d="M 65 95 C 65 120 85 155 100 155 C 115 155 135 120 135 95 Z" fill="#FFFFFF" />
              {/* Cream layers */}
              <path d="M 70 100 C 70 115 85 145 100 145 C 115 145 130 115 130 100 Z" fill="#F5F5F5" opacity="0.7" />
              <path d="M 75 105 C 75 115 85 130 100 130 C 115 130 125 115 125 105 Z" fill="#FFFFFF" opacity="0.5" />
              
              {/* Mustache flare */}
              <path d="M 95 100 C 80 105 68 115 72 135 C 85 130 95 120 100 105" fill="#FFFFFF" />
              <path d="M 105 100 C 120 105 132 115 128 135 C 115 130 105 120 100 105" fill="#FFFFFF" />
            </g>

            {/* Nose - Black and shiny */}
            <path d="M 93 102 C 93 96 100 94 107 102 C 107 110 100 112 93 102" fill="#000" />
            <circle cx="97" cy="100" r="1.5" fill="#FFF" opacity="0.2" />
            
            {/* Mouth - Subtle line */}
            {isEating && (
              <path d="M 95 120 Q 100 125 105 120" stroke="#444" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}
          </motion.g>
        </motion.svg>
      </div>
    </div>
  );
}
