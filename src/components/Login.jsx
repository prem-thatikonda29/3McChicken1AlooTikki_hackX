import React from "react";

function Login() {
  return (
    <section className="w-full h-screen bg-blue-400 flex p-4">
      <div className="h-full w-1/2"></div>
      <div className="h-full w-1/2 px-horizontal py-vertical bg-white/40 rounded-2xl">
        <h1 className="font-poppins text-6xl mb-bottom">Login</h1>

        <div className="w-full h-3/4 bg-white/60 backdrop-blur-lg border border-white/20 shadow-[2px_2px_4px_rgba(255,255,255,0.2)] rounded-4xl"></div>
      </div>
    </section>
  );
}

export default Login;
