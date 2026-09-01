"use client";

interface Props {
  valore: number;
  onChange: (val: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep2Partecipanti({ valore, onChange, onNext, onBack }: Props) {
  const opzioni = [6, 8, 10, 12];

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Numero partecipanti</h2>
      <div className="grid grid-cols-2 gap-4 mb-8">
        {opzioni.map((num) => (
          <button
            key={num}
            onClick={() => onChange(num)}
            className={`py-4 rounded-lg text-xl font-bold border ${
              valore === num
                ? "bg-green-600 border-green-400 text-white"
                : "bg-gray-800 border-gray-700 text-gray-300"
            }`}
          >
            {num}
          </button>
        ))}
        <button
          onClick={() => onChange(14)}
          className="py-4 rounded-lg text-xl font-bold border bg-gray-800 border-gray-700 text-gray-300"
        >
          Personalizzato
        </button>
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-400 underline">Indietro</button>
        <button onClick={onNext} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
      </div>
    </div>
  );
}