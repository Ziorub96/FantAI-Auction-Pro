"use client";

export default function WizardStep1Benvenuto({ onNext }: { onNext: () => void }) {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold text-green-500 mb-4">FantAI Auction Pro</h1>
      <p className="text-gray-300 mb-8">
        Configura la tua lega per ottenere un assistente d'asta intelligente.
      </p>
      <button
        onClick={onNext}
        className="w-full rounded-lg bg-orange-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-orange-500 transition"
      >
        Nuova Lega
      </button>
    </div>
  );
}