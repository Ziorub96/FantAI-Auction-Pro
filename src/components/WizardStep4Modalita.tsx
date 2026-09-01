"use client";

interface Props {
  valore: "classic" | "mantra";
  onChange: (val: "classic" | "mantra") => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep4Modalita({ valore, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Modalità</h2>
      <div className="space-y-4 mb-8">
        <button
          onClick={() => onChange("classic")}
          className={`w-full p-4 rounded-lg border ${
            valore === "classic"
              ? "bg-green-600 border-green-400 text-white"
              : "bg-gray-800 border-gray-700 text-gray-300"
          }`}
        >
          Classic
        </button>
        <button
          onClick={() => onChange("mantra")}
          className={`w-full p-4 rounded-lg border ${
            valore === "mantra"
              ? "bg-green-600 border-green-400 text-white"
              : "bg-gray-800 border-gray-700 text-gray-300"
          }`}
        >
          Mantra
        </button>
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-400 underline">Indietro</button>
        <button onClick={onNext} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
      </div>
    </div>
  );
}