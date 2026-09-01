"use client";

interface Regole {
  modificatoreDifesa: boolean;
  imbattibilita: boolean;
  portaInviolata: boolean;
  assist: boolean;
  rigori: boolean;
}

interface Props {
  valore: Regole;
  onChange: (nuoveRegole: Regole) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function WizardStep6Regole({ valore, onChange, onNext, onBack }: Props) {
  const toggle = (chiave: keyof Regole) => {
    onChange({ ...valore, [chiave]: !valore[chiave] });
  };

  const opzioni = [
    { nome: "Modificatore difesa", chiave: "modificatoreDifesa" },
    { nome: "Imbattibilità", chiave: "imbattibilita" },
    { nome: "Porta inviolata", chiave: "portaInviolata" },
    { nome: "Assist", chiave: "assist" },
    { nome: "Rigori", chiave: "rigori" },
  ] as const;

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Regole</h2>
      <div className="space-y-4 mb-8">
        {opzioni.map((opzione) => (
          <div key={opzione.chiave} className="flex items-center justify-between">
            <span className="text-gray-300">{opzione.nome}</span>
            <button
              onClick={() => toggle(opzione.chiave)}
              className={`w-14 h-8 rounded-full p-1 transition-colors ${
                valore[opzione.chiave] ? "bg-green-600" : "bg-gray-700"
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full bg-white transform transition-transform ${
                  valore[opzione.chiave] ? "translate-x-6" : ""
                }`}
              />
            </button>
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