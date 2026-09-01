"use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    alert("JavaScript funziona!");
    setCount((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-4xl font-bold text-green-500 mb-4">
          FantAI Test
        </h1>

        <p className="text-gray-300 mb-8">
          Se il pulsante qui sotto funziona, significa che React, JavaScript e
          gli eventi touch su iPhone sono operativi.
        </p>

        <div className="mb-8">
          <p className="text-sm text-gray-400 mb-2">Contatore</p>
          <p className="text-5xl font-bold">{count}</p>
        </div>

        <button
          onClick={handleClick}
          className="w-full rounded-xl bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition active:scale-95 hover:bg-orange-500"
        >
          Premi qui
        </button>
      </div>
    </main>
  );
}