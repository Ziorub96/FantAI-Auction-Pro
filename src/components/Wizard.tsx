"use client";

import { useState } from "react";
import WizardStep1Benvenuto from "./WizardStep1Benvenuto";
import WizardStep2Partecipanti from "./WizardStep2Partecipanti";
import WizardStep3Budget from "./WizardStep3Budget";
import WizardStep4Modalita from "./WizardStep4Modalita";
import WizardStep5Rosa from "./WizardStep5Rosa";
import WizardStep6Regole from "./WizardStep6Regole";
import WizardStep7Ordine from "./WizardStep7Ordine";

export interface LegaConfig {
  partecipanti: number;
  budget: number;
  modalita: "classic" | "mantra";
  rosa: {
    portieri: number;
    difensori: number;
    centrocampisti: number;
    attaccanti: number;
  };
  regole: {
    modificatoreDifesa: boolean;
    imbattibilita: boolean;
    portaInviolata: boolean;
    assist: boolean;
    rigori: boolean;
  };
  ordineAsta: "random" | "libera" | "manuale";
}

const configIniziale: LegaConfig = {
  partecipanti: 8,
  budget: 500,
  modalita: "classic",
  rosa: {
    portieri: 3,
    difensori: 8,
    centrocampisti: 8,
    attaccanti: 6,
  },
  regole: {
    modificatoreDifesa: false,
    imbattibilita: false,
    portaInviolata: false,
    assist: false,
    rigori: false,
  },
  ordineAsta: "random",
};

interface WizardProps {
  onComplete: () => void;
}

export default function Wizard({ onComplete }: WizardProps) {
  const [passo, setPasso] = useState(1);
  const [config, setConfig] = useState<LegaConfig>(configIniziale);

  const vaiAvanti = () => setPasso((p) => p + 1);
  const vaiIndietro = () => setPasso((p) => p - 1);

  const aggiornaConfig = (nuovaParte: Partial<LegaConfig>) => {
    setConfig((prev) => ({ ...prev, ...nuovaParte }));
  };

  const completaWizard = () => {
    localStorage.setItem("legaconfig", JSON.stringify(config));
    onComplete();
  };

  const passi = [
    <WizardStep1Benvenuto key="1" onNext={vaiAvanti} />,
    <WizardStep2Partecipanti
      key="2"
      valore={config.partecipanti}
      onChange={(val) => aggiornaConfig({ partecipanti: val })}
      onNext={vaiAvanti}
      onBack={vaiIndietro}
    />,
    <WizardStep3Budget
      key="3"
      valore={config.budget}
      onChange={(val) => aggiornaConfig({ budget: val })}
      onNext={vaiAvanti}
      onBack={vaiIndietro}
    />,
    <WizardStep4Modalita
      key="4"
      valore={config.modalita}
      onChange={(val) => aggiornaConfig({ modalita: val })}
      onNext={vaiAvanti}
      onBack={vaiIndietro}
    />,
    <WizardStep5Rosa
      key="5"
      valore={config.rosa}
      onChange={(nuovaRosa) => aggiornaConfig({ rosa: nuovaRosa })}
      onNext={vaiAvanti}
      onBack={vaiIndietro}
    />,
    <WizardStep6Regole
      key="6"
      valore={config.regole}
      onChange={(nuoveRegole) => aggiornaConfig({ regole: nuoveRegole })}
      onNext={vaiAvanti}
      onBack={vaiIndietro}
    />,
    <WizardStep7Ordine
      key="7"
      valore={config.ordineAsta}
      onChange={(val) => aggiornaConfig({ ordineAsta: val })}
      onComplete={completaWizard}
      onBack={vaiIndietro}
    />,
  ];

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-md">{passi[passo - 1]}</div>
    </main>
  );
}