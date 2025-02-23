// import React from "react";
import Navbar from "../atoms/Navbar";
import NearbyHospitalsOSM from "./Map";

function Home() {
  return (
    <section className="w-full h-screen flex gap-4 p-4">
      <Navbar />
      <div className="w-full h-full flex flex-col gap-4 rounded-xl p-4 bg-cyan-50">
        <div className="shadow-lg shadow-gray-700/50 w-full h-1/2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20">
          <h1>Avatar</h1>
        </div>
        <div className="w-full h-1/2 rounded-lg flex gap-4">
          <div className="w-2/5 h-full rounded-md shadow-lg shadow-gray-700/50 bg-white/10 backdrop-blur-lg border border-white/20">
            <h1>Risk Percentage meter</h1>
          </div>

          <div className="w-3/5 h-full rounded-md flex gap-4">
            <div className="w-1/2 h-full rounded-md flex flex-col gap-4">
              <div className="w-full h-2/5 rounded-md shadow-lg shadow-gray-700/50 bg-white/10 backdrop-blur-lg border border-white/20">
                <h1>Pie Graph</h1>
              </div>
              <div className="w-full h-3/5 rounded-md shadow-lg shadow-gray-700/50 bg-white/10 backdrop-blur-lg border border-white/20">
                <h1>Bar Graph</h1>
              </div>
            </div>
            <div className="w-1/2 h-full rounded-md flex flex-col gap-4">
              <div className="w-full h-3/5 rounded-md shadow-lg shadow-gray-700/50 bg-white/10 backdrop-blur-lg border border-white/20">
                {/* <h1>Nearby Hospitals</h1> */}
                <NearbyHospitalsOSM/>
              </div>
              <div className="w-full h-2/5 rounded-md shadow-lg shadow-gray-700/50 bg-white/10 backdrop-blur-lg border border-white/20">
                <h1>button to download reports as a pdf</h1>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Home;
