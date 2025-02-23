import React, { useState } from "react";
import Stack from "../bits/Stack";
import { Stethoscope, ChartColumn, Landmark } from "lucide-react";

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

  const handleCardChange = (newTopCardId) => {
    const newCard = images.find((card) => card.id === newTopCardId);
    if (newCard) setCurrentText(newCard.text);
  };

  return (
    <section className="flex w-full h-screen justify-center items-center bg-blue-500 p-6">
      {/* Top Section with Dynamic Text */}
      <div className="w-1/2 h-full flex justify-center items-center">
        <Stack
          randomRotation={false}
          sensitivity={180}
          sendToBackOnClick={false}
          cardDimensions={{ width: 400, height: 400 }}
          cardsData={images}
          onTopCardChange={handleCardChange} // Function to update text dynamically
        />
      </div>
      <div className="w-1/2 h-full flex flex-col justify-center items-center">
        <h1 className="text-4xl text-gray-200">{currentText.heading}</h1>
        <p className="text-lg text-gray-200 mt-2 max-w-lg">
          {currentText.subheading}
        </p>
      </div>
    </section>
  );
}

export default Landing;
