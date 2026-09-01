"use client";

import { useState } from "react";
import Wizard from "@/components/Wizard";
import ImportListone from "@/components/ImportListone";

export default function Home() {
  const [configSaved, setConfigSaved] = useState(false);

  const handleWizardComplete = () => {
    // Salviamo la config e passiamo all'import
    localStorage.setItem("legaconfig", JSON.stringify({ saved: true }));
    setConfigSaved(true);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {!configSaved ? (
        <Wizard onComplete={handleWizardComplete} />
      ) : (
        <ImportListone />
      )}
    </main>
  );
}