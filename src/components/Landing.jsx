import React from "react";
import Stack from "../bits/Stack";
import { Stethoscope, ChartColumn, Landmark } from "lucide-react";

function Landing() {
  const images = [
    {
      id: 1,
      type: "icon",
      img: <Stethoscope size={160} color="white" />,
    },
    {
      id: 2,
      type: "icon",
      img: <ChartColumn size={160} color="white" />,
    },
    {
      id: 3,
      type: "icon",
      img: <Landmark size={160} color="white" />,
    },
  ];

  return (
    <section className="flex w-full h-screen justify-center items-center bg-blue-500">
      <Stack
        randomRotation={false}
        sensitivity={180}
        sendToBackOnClick={false}
        cardDimensions={{ width: 400, height: 400 }}
        cardsData={images}
      />
    </section>
  );
}

export default Landing;
