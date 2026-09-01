use client";

import { useState } from "react";

export default function Home() {
  const [count, setCount] = useState(0);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">FantAI Test</h1>

      <p className="mb-6 text-xl">Click: {count}</p>

      <button
        onClick={() => {
          alert("JavaScript funziona!");
          setCount(count + 1);
        }}
        className="bg-orange-600 px-8 py-4 rounded-xl text-lg active:scale-95"
      >
        Premi qui
      </button>
    </main>
  );
}
