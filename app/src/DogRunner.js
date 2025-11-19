import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import Lottie from 'lottie-react';
import dogAnimation from './happy_dog.json';
import ProgressBar from 'react-bootstrap/ProgressBar';


export function DogRunner() {
  const lottieRef = useRef();

  useEffect(() => {
    lottieRef.current?.setSpeed(1);
  }, []);

  const handleMouseEnter = () => {
    lottieRef.current?.setSpeed(3);
  };

  const handleMouseLeave = () => {
    lottieRef.current?.setSpeed(1);
  };

  return (
    <motion.div
      style={{
        position: "absolute",
        bottom: "5%",      // distance depuis le bas de la page
        left: "50%",          // centre horizontal
        transform: "translateX(-50%)",// ✔ centre l'élément
        width: 1000,     // ✔ augmente la taille (tu peux mettre 400, 500...)
      }}
    // animate={{ x: [0, 200, 0] }} // mouvement latéral autour du centre
    //transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
    >
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 1000,   // taille réelle du Lottie
          height: 600,
        }}
      >
        <Lottie
          animationData={dogAnimation}
          loop={true}
          lottieRef={lottieRef}
          style={{
            width: "100%",
            height: "100%",
          }}
        />

        {/* Hitbox invisible */}
        <div
          style={{
            position: "absolute",
            top: "27%",    // position verticale du chien dans le Lottie
            left: "38%",   // position horizontale du chien
            width: "30%",  // largeur du chien
            height: "55%", // hauteur du chien
            border: "2px solid red",
            cursor: "pointer",
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </div>
    </motion.div>
  );
}

export function ProgressBars() {
  return (
    <div style={{ width: '100%', maxWidth: '500px', margin: '20px auto' }}>
      <h3>Mes barres de progression</h3>

      <span style={{
        position: 'absolute',
        bot: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        color: 'black',
        fontWeight: 'bold'
      }}>Nourriture</span>
      <ProgressBar variant="success" now={50} style={{ background: 'linear-gradient(to right, #5fff6cff, #feb47b)', height: '20px', marginTop: '10px' }} />
      <span>Energie</span>
      <ProgressBar variant="info" now={75} style={{ background: 'linear-gradient(to right, #ff7e5f, #feb47b)', height: '20px', marginTop: '10px' }} />
      <span>Emotion</span>
      <ProgressBar variant="warning" now={40} style={{ background: 'linear-gradient(to right, #ff7e5f, #feb47b)', height: '40px', marginTop: '10px' }} />
      <span>Quelque chose</span>
      <ProgressBar variant="danger" now={90} style={{ background: 'linear-gradient(to right, #ff7e5f, #feb47b)', height: '20px', marginTop: '10px' }} />
    </div>
  );
}
