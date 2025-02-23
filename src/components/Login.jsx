import React, { useState } from "react";
import BlurText from "../bits/BlurText";
import MedicalForm from "./Form2";
import { motion } from "framer-motion";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const handleAnimationComplete = () => {
    console.log("Animation completed!");
};

function Login() {
    const [showConsentModal, setShowConsentModal] = useState(true);
    const [consentChecked, setConsentChecked] = useState(false);

    // Add the Consent Modal component
    const ConsentModal = () => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
                <h2 className="text-2xl font-poppins font-semibold text-gray-800 mb-6">
                    Medical Data Consent Form
                </h2>

                <div className="prose prose-sm text-gray-600 mb-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">
                        Indian Medical Guidelines for Data Processing
                    </h3>

                    <div className="space-y-4">
                        <p>
                            In accordance with the Indian Medical Council
                            (Professional Conduct, Etiquette and Ethics)
                            Regulations and relevant data protection laws, we
                            request your consent for the following:
                        </p>

                        <div className="bg-blue-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">
                                Data Collection & Usage:
                            </h4>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    Collection and processing of your medical
                                    history and health-related information
                                </li>
                                <li>
                                    Analysis of your health data for risk
                                    assessment and predictions
                                </li>
                                <li>
                                    Secure storage of your medical information
                                    in accordance with Indian healthcare
                                    regulations
                                </li>
                                <li>
                                    Use of AI and machine learning algorithms
                                    for health analysis
                                </li>
                            </ul>
                        </div>

                        <div className="bg-green-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">
                                Your Rights:
                            </h4>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>Access to your medical data at any time</li>
                                <li>
                                    Right to request data modification or
                                    deletion
                                </li>
                                <li>Withdrawal of consent at any stage</li>
                                <li>Privacy protection under Indian law</li>
                            </ul>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-700 mb-2">
                                Data Security:
                            </h4>
                            <ul className="list-disc pl-5 space-y-2">
                                <li>
                                    End-to-end encryption of your medical data
                                </li>
                                <li>
                                    Compliance with Indian healthcare data
                                    protection standards
                                </li>
                                <li>Regular security audits and updates</li>
                                <li>
                                    Restricted access to authorized personnel
                                    only
                                </li>
                            </ul>
                        </div>

                        <p className="text-sm italic">
                            This consent form complies with the guidelines set
                            by the Medical Council of India and relevant Indian
                            healthcare regulations.
                        </p>
                    </div>
                </div>

                <div className="border-t pt-6">
                    <label className="flex items-center space-x-3 mb-6 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={consentChecked}
                            onChange={(e) =>
                                setConsentChecked(e.target.checked)
                            }
                            className="form-checkbox h-5 w-5 text-blue-500 rounded border-gray-300 
                focus:ring-blue-500 transition duration-150 ease-in-out"
                        />
                        <span className="text-gray-700">
                            I have read and agree to the medical data processing
                            terms and conditions
                        </span>
                    </label>

                    <button
                        onClick={() => {
                            if (consentChecked) {
                                setShowConsentModal(false);
                                toast.success(
                                    "Consent accepted. You can now proceed with registration."
                                );
                            } else {
                                toast.warning(
                                    "Please accept the terms to continue."
                                );
                            }
                        }}
                        disabled={!consentChecked}
                        className={`w-full py-3 px-6 rounded-xl font-poppins font-medium transition-all duration-300 
              ${
                  consentChecked
                      ? "bg-blue-500 text-white hover:bg-blue-600 shadow-lg hover:shadow-xl"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
              }`}
                    >
                        Continue
                    </button>
                </div>
            </motion.div>
        </div>
    );

    return (
        <>
            <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            {showConsentModal && <ConsentModal />}

            <section className="w-full h-screen bg-[#e3f2fd] flex p-4">
                <div className="h-full w-1/2 flex flex-col">
                    <div className="w-full h-full flex justify-center items-center">
                        <BlurText
                            text="Vitals"
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
                    <h1 className="font-poppins text-6xl mb-bottom">
                        Register
                    </h1>

                    <div className="w-full h-3/4 bg-white/60 backdrop-blur-lg border border-white/20 shadow-[2px_2px_4px_rgba(255,255,255,0.2)] rounded-4xl overflow-scroll">
                        <MedicalForm />
                    </div>
                </motion.div>
            </section>
        </>
    );
}

export default Login;
