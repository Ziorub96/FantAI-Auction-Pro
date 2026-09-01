"use client";

interface Props {
  valore: {
    portieri: number;
    difensori: number;
    centrocampisti: number;
    attaccanti: number;
  };
  onChange: (nuovaRosa: Props["valore"]) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep5Rosa({ valore, onChange, onNext, onBack }: Props) {
  const ruoli = [
    { nome: "Portieri", chiave: "portieri" },
    { nome: "Difensori", chiave: "difensori" },
    { nome: "Centrocampisti", chiave: "centrocampisti" },
    { nome: "Attaccanti", chiave: "attaccanti" },
  ] as const;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Composizione rosa</h2>
      <div className="space-y-4 mb-8">
        {ruoli.map((ruolo) => (
          <div key={ruolo.chiave} className="flex items-center justify-between">
            <span className="text-gray-300">{ruolo.nome}</span>
            <input
              type="number"
              min={0}
              value={valore[ruolo.chiave]}
              onChange={(e) =>
                onChange({ ...valore, [ruolo.chiave]: Number(e.target.value) })
              }
              className="w-20 p-2 rounded bg-gray-800 text-white text-center border border-gray-700"
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-400 underline">Indietro</button>
        <button onClick={onNext} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
      </div>
    </div>
  );
}