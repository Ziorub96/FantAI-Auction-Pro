"use client";

interface Props {
  valore: "random" | "libera" | "manuale";
  onChange: (val: "random" | "libera" | "manuale") => void;
  onComplete: () => void;
  onBack: () => void;
}

export default function WizardStep7Ordine({ valore, onChange, onComplete, onBack }: Props) {
  const opzioni = [
    { nome: "Random per ruolo", chiave: "random" },
    { nome: "Libera", chiave: "libera" },
    { nome: "Manuale", chiave: "manuale" },
  ] as const;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Ordine asta</h2>
      <div className="space-y-4 mb-8">
        {opzioni.map((opzione) => (
          <button
            key={opzione.chiave}
            onClick={() => onChange(opzione.chiave)}
            className={`w-full p-4 rounded-lg border ${
              valore === opzione.chiave
                ? "bg-green-600 border-green-400 text-white"
                : "bg-gray-800 border-gray-700 text-gray-300"
            }`}
          >
            {opzione.nome}
          </button>
        ))}
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-400 underline">Indietro</button>
        <button
          onClick={onComplete}
          className="bg-orange-600 text-white px-6 py-2 rounded-lg"
        >
          Completa
        </button>
      </div>
    </div>
  );
}