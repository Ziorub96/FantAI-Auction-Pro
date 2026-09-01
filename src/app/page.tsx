"use client";
import { useState } from "react";
export default function Home() {
  const [passo, setPasso] = useState(1);
  return (
    <main className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center">
        {passo === 1 && (
          <div>
            <h1 className="text-3xl font-bold text-green-500 mb-4">
              FantAI Auction Pro
            </h1>
            <p className="text-gray-400 mb-8">
              Test wizard
            </p>
            <button
              type="button"
              onClick={() => setPasso(2)}
              className="w-full rounded-xl bg-orange-600 px-8 py-4 text-lg font-bold text-white"
            >
              Nuova Lega
            </button>
          </div>
        )}
        {passo === 2 && (
          <div>
            <h1 className="text-3xl font-bold text-green-500 mb-4">
              Passo 2
            </h1>
            <p className="text-gray-400 mb-8">
              Il cambio di stato funziona!
            </p>
            <button
              type="button"
              onClick={() => setPasso(1)}
              className="w-full rounded-xl bg-gray-700 px-8 py-4 text-lg font-bold text-white"
            >
              Torna indietro
            </button>
          </div>
        )}
        <p className="mt-8 text-xs text-gray-600">
          Stato attuale: {passo}
        </p>
      </div>
    </main>
  );
}