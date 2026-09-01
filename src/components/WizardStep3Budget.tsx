"use client";

interface Props {
  valore: number;
  onChange: (val: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep3Budget({ valore, onChange, onNext, onBack }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Budget iniziale</h2>
      <input
        type="number"
        value={valore}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full p-3 rounded-lg bg-gray-800 text-white text-xl mb-8 border border-gray-700"
        placeholder="Es. 500"
      />
      <div className="flex justify-between">
        <button onClick={onBack} className="text-gray-400 underline">Indietro</button>
        <button onClick={onNext} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
      </div>
    </div>
  );
}