import React, { useState, useEffect } from "react";
import Stack from "../bits/Stack";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  Stethoscope,
  ChartColumn,
  Landmark,
  ChevronRight,
  ClipboardCheck,
  FileQuestion,
  FileText,
  LayoutDashboard,
  Github,
  Linkedin,
  Twitter,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Simple 3D component instead of loading a model
function SimpleHealthSymbol() {
  return (
    <mesh rotation={[0, 0, 0]}>
      <torusGeometry args={[2, 0.5, 16, 32]} />
      <meshStandardMaterial color="#4299e1" />
    </mesh>
  );
}

function Landing() {
  const images = [
    {
      id: 1,
      type: "icon",
      img: <Stethoscope size={160} color="white" />,
      text: {
        heading: "Medical Risk Analysing",
        subheading: "Get the best healthcare insights.",
      },
    },
    {
      id: 2,
      type: "icon",
      img: <ChartColumn size={160} color="white" />,
      text: {
        heading: "Risk Analytic Reports",
        subheading:
          "Visualize your health in clean graphical views and insights.",
      },
    },
    {
      id: 3,
      type: "icon",
      img: <Landmark size={160} color="white" />,
      text: {
        heading: "Dashboard Views for Underwriters",
        subheading: "Help underwriters approve insurances efficiently",
      },
    },
  ];

  const [currentText, setCurrentText] = useState(images[0].text);
  const [currentStep, setCurrentStep] = useState(1);
  const { scrollY } = useScroll();
  const navigate = useNavigate();

  const y = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity = useTransform(scrollY, [0, 300], [1, 0]);

  const progressSteps = [
    {
      step: 1,
      title: "Initial User Questions",
      description: "Basic Information & Lifestyle Assessment",
      icon: <FileQuestion className="text-blue-500" size={24} />,
    },
    {
      step: 2,
      title: "Dynamic Follow-Up Questions",
      description: "Based on Input & Medical Reports",
      icon: <ClipboardCheck className="text-blue-500" size={24} />,
    },
    {
      step: 3,
      title: "Risk Assessment Report",
      description: "Comprehensive Analysis & Recommendations",
      icon: <FileText className="text-blue-500" size={24} />,
    },
    {
      step: 4,
      title: "Underwriter Dashboard",
      description: "Real-time Decision Support Interface",
      icon: <LayoutDashboard className="text-blue-500" size={24} />,
    },
  ];

  const handleGetStarted = () => {
    navigate("/questions");
  };

  return (
    <div className="relative w-full min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Animated flowing background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <svg
          className="absolute w-[200%] h-[200%] -top-1/2 -left-1/2 animate-slow-spin opacity-30"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#3B82F6" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <path
            d="M 0,400 C 600,400 800,0 1200,0 L 1200,800 L 0,800 Z"
            fill="url(#gradient)"
            className="animate-wave"
          />
          <path
            d="M 0,500 C 400,500 800,100 1200,100 L 1200,800 L 0,800 Z"
            fill="url(#gradient)"
            className="animate-wave-slow"
          />
        </svg>
      </div>

      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="container mx-auto px-6 h-full flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 text-center md:text-left">
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Your Health, Our Priority
            </h1>
            <p className="text-xl text-gray-700 mb-8">
              Advanced AI-powered health risk assessment for personalized care
              recommendations
            </p>
            <motion.button
              onClick={handleGetStarted}
              className="px-8 py-4 bg-blue-600 text-white rounded-full text-xl font-semibold hover:bg-blue-700 transition-colors shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
            </motion.button>
          </div>

          <div className="md:w-1/2 h-[500px] flex items-center justify-center">
            {/* Medical/Insurance themed SVG */}
            <motion.svg
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="w-full h-full max-w-md"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Medical Cross */}
              <motion.path
                d="M50 10 L50 90 M10 50 L90 50"
                stroke="#3B82F6"
                strokeWidth="8"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              {/* Circular border */}
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                stroke="#3B82F6"
                strokeWidth="4"
                strokeDasharray="251.2"
                initial={{ strokeDashoffset: 251.2 }}
                animate={{ strokeDashoffset: 0 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              {/* Pulse effect */}
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="#60A5FA"
                strokeWidth="2"
                className="animate-ping opacity-20"
              />
            </motion.svg>
          </div>
        </div>
      </section>

      {/* Underwriting Process Comparison Section */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            Transforming the Underwriting Journey
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Traditional Process */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl shadow-xl"
            >
              <h3 className="text-2xl font-semibold text-red-600 mb-6">
                Traditional Underwriting Process
              </h3>
              <div className="space-y-4">
                {[
                  { text: "Manual document review", time: "2-3 days" },
                  { text: "Multiple medical examinations", time: "1-2 weeks" },
                  { text: "Lengthy questionnaires", time: "4-5 hours" },
                  { text: "Back-and-forth communication", time: "3-5 days" },
                  { text: "Risk assessment compilation", time: "1 week" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-red-50 rounded-lg"
                  >
                    <svg
                      className="w-6 h-6 text-red-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{item.text}</p>
                      <p className="text-sm text-red-600">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-gray-600">Total Time: 3-4 weeks</p>
            </motion.div>

            {/* Our AI-Powered Process */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white p-8 rounded-2xl shadow-xl"
            >
              <h3 className="text-2xl font-semibold text-green-600 mb-6">
                Our AI-Powered Process
              </h3>
              <div className="space-y-4">
                {[
                  { text: "Smart document analysis", time: "Seconds" },
                  { text: "AI risk assessment", time: "2-3 minutes" },
                  { text: "Dynamic questionnaire", time: "15 minutes" },
                  { text: "Automated communication", time: "Instant" },
                  { text: "Real-time decision making", time: "Minutes" },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center p-3 bg-green-50 rounded-lg"
                  >
                    <svg
                      className="w-6 h-6 text-green-500 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <div>
                      <p className="font-medium">{item.text}</p>
                      <p className="text-sm text-green-600">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-gray-600">
                Total Time: Less than 30 minutes
              </p>
            </motion.div>
          </div>

          {/* Benefits Summary */}
          <div className="mt-20 text-center">
            <h3 className="text-2xl font-semibold mb-8">
              Why Choose Our AI-Powered Solution?
            </h3>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Time Efficient",
                  description: "Reduce processing time from weeks to minutes",
                  icon: "⚡",
                },
                {
                  title: "More Accurate",
                  description: "AI-driven analysis reduces human error",
                  icon: "🎯",
                },
                {
                  title: "Cost Effective",
                  description:
                    "Lower operational costs and better resource allocation",
                  icon: "💰",
                },
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="bg-white p-6 rounded-xl shadow-lg"
                >
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h4 className="text-xl font-semibold mb-2">
                    {benefit.title}
                  </h4>
                  <p className="text-gray-600">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row gap-12 items-center">
            {/* Stack Component */}
            <motion.div
              className="w-full md:w-1/2"
              initial={{ x: -100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <Stack
                randomRotation={false}
                sensitivity={180}
                sendToBackOnClick={false}
                cardDimensions={{ width: 400, height: 400 }}
                cardsData={images}
                onTopCardChange={(id) => {
                  const newCard = images.find((card) => card.id === id);
                  if (newCard) setCurrentText(newCard.text);
                }}
              />
            </motion.div>

            {/* Progress Steps */}
            <motion.div
              className="w-full md:w-1/2"
              initial={{ x: 100, opacity: 0 }}
              whileInView={{ x: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <h2 className="text-3xl font-bold text-blue-900 mb-6">
                  Assessment Journey
                </h2>
                <div className="space-y-4">
                  {progressSteps.map((step) => (
                    <motion.div
                      key={step.step}
                      className={`flex items-center p-4 rounded-xl transition-all cursor-pointer
                        ${
                          currentStep === step.step
                            ? "bg-blue-50 shadow-md"
                            : "hover:bg-gray-50"
                        }
                        ${step.step < currentStep ? "opacity-60" : ""}`}
                      onClick={() => setCurrentStep(step.step)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        {step.icon}
                      </div>
                      <div className="ml-4 flex-1">
                        <h3 className="text-xl font-semibold text-blue-900">
                          {step.title}
                        </h3>
                        <p className="text-blue-600">{step.description}</p>
                      </div>
                      <ChevronRight className="text-blue-500" />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-blue-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-2xl font-bold mb-4">HealthRisk AI</h3>
              <p className="text-blue-200">
                Transforming healthcare risk assessment through artificial
                intelligence
              </p>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-blue-200">
                <li>
                  <a href="#" className="hover:text-white">
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Services
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-xl font-semibold mb-4">Connect With Us</h4>
              <div className="flex space-x-4">
                <a href="#" className="hover:text-blue-300">
                  <Github />
                </a>
                <a href="#" className="hover:text-blue-300">
                  <Linkedin />
                </a>
                <a href="#" className="hover:text-blue-300">
                  <Twitter />
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-blue-800 text-center text-blue-200">
            <p>&copy; 2024 HealthRisk AI. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
