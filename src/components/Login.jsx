// import React from "react";
import BlurText from "../bits/BlurText";
import MedicalForm from "./Form2";
import { motion } from "framer-motion";

const handleAnimationComplete = () => {
  console.log("Animation completed!");
};

function Login() {
  return (
    <section className="w-full h-screen bg-[#e3f2fd] flex p-4">
      <div className="h-full w-1/2 flex flex-col">
        <div className="w-full h-full flex justify-center items-center">
          <BlurText
            text="HEHEHEH"
            delay={150}
            animateBy="letters"
            direction="top"
            onAnimationComplete={handleAnimationComplete}
            className="text-8xl mb-8"
          />
        </div>
        {/* <div className="w-full h-3/4">
          <MetaBalls
            color="#bbdefb"
            cursorBallColor="#bbdefb"
            cursorBallSize={2}
            ballCount={16}
            animationSize={30}
            enableMouseInteraction={true}
            enableTransparency={true}
            hoverSmoothness={0.08}
            clumpFactor={1}
            speed={0.5}
          />
        </div> */}
      </div>
      <motion.div
        initial={{ x: "100vw", opacity: 0 }} // Start from outside the page (right)
        animate={{ x: 0, opacity: 1 }} // Animate into position
        exit={{ x: "100vw", opacity: 0 }} // Animate out when unmounted
        transition={{
          type: "spring",
          stiffness: 60,
          damping: 20,
        }}
        className="h-full w-1/2 px-horizontal py-vertical bg-white/40 rounded-2xl"
      >
        <h1 className="font-poppins text-6xl mb-bottom">Register</h1>

        <div className="w-full h-3/4 bg-white/60 backdrop-blur-lg border border-white/20 shadow-[2px_2px_4px_rgba(255,255,255,0.2)] rounded-4xl">
          <MedicalForm />
        </div>
      </motion.div>
    </section>
  );
}

export default Login;
