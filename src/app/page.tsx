"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";

interface LegaConfig {
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

export default function Home() {
  const [view, setView] = useState<"wizard" | "import" | "dashboard">("wizard");
  const [passo, setPasso] = useState(1);
  const [config, setConfig] = useState<LegaConfig>(configIniziale);
  const [fileName, setFileName] = useState<string>("");
  const [players, setPlayers] = useState<any[]>([]);
  const [message, setMessage] = useState<string>("");

  // ---- Funzioni wizard ----
  const vaiAvanti = () => setPasso((p) => p + 1);
  const vaiIndietro = () => setPasso((p) => p - 1);
  const aggiornaConfig = (nuovaParte: Partial<LegaConfig>) => {
    setConfig((prev) => ({ ...prev, ...nuovaParte }));
  };
  const completaWizard = () => {
    localStorage.setItem("legaconfig", JSON.stringify(config));
    setView("import");
  };

  // ---- Funzione import ----
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    localStorage.setItem("listone", JSON.stringify(jsonData));
    setPlayers(jsonData);
    setMessage(`Importati ${jsonData.length} giocatori dal file ${file.name}`);
  };

  // ---- Vista: wizard ----
  const contenutoPasso = () => {
    switch (passo) {
      case 1:
        return (
          <div className="text-center">
            <h1 className="text-4xl font-bold text-green-500 mb-4">FantAI Auction Pro</h1>
            <p className="text-gray-300 mb-8">
              Configura la tua lega per ottenere un assistente d'asta intelligente.
            </p>
            <button
              onClick={vaiAvanti}
              className="w-full rounded-lg bg-orange-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-orange-500 transition"
            >
              Nuova Lega
            </button>
          </div>
        );
      case 2:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Numero partecipanti</h2>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[6, 8, 10, 12].map((num) => (
                <button
                  key={num}
                  onClick={() => aggiornaConfig({ partecipanti: num })}
                  className={`py-4 rounded-lg text-xl font-bold border ${
                    config.partecipanti === num
                      ? "bg-green-600 border-green-400 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300"
                  }`}
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => aggiornaConfig({ partecipanti: 14 })}
                className="py-4 rounded-lg text-xl font-bold border bg-gray-800 border-gray-700 text-gray-300"
              >
                Personalizzato
              </button>
            </div>
            <div className="flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
            </div>
          </div>
        );
      case 3:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Budget iniziale</h2>
            <input
              type="number"
              value={config.budget}
              onChange={(e) => aggiornaConfig({ budget: Number(e.target.value) })}
              className="w-full p-3 rounded-lg bg-gray-800 text-white text-xl mb-8 border border-gray-700"
              placeholder="Es. 500"
            />
            <div className="flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
            </div>
          </div>
        );
      case 4:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Modalità</h2>
            <div className="space-y-4 mb-8">
              <button
                onClick={() => aggiornaConfig({ modalita: "classic" })}
                className={`w-full p-4 rounded-lg border ${
                  config.modalita === "classic"
                    ? "bg-green-600 border-green-400 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-300"
                }`}
              >
                Classic
              </button>
              <button
                onClick={() => aggiornaConfig({ modalita: "mantra" })}
                className={`w-full p-4 rounded-lg border ${
                  config.modalita === "mantra"
                    ? "bg-green-600 border-green-400 text-white"
                    : "bg-gray-800 border-gray-700 text-gray-300"
                }`}
              >
                Mantra
              </button>
            </div>
            <div className="flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
            </div>
          </div>
        );
      case 5:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Composizione rosa</h2>
            <div className="space-y-4 mb-8">
              {[
                { nome: "Portieri", chiave: "portieri" },
                { nome: "Difensori", chiave: "difensori" },
                { nome: "Centrocampisti", chiave: "centrocampisti" },
                { nome: "Attaccanti", chiave: "attaccanti" },
              ].map((ruolo) => (
                <div key={ruolo.chiave} className="flex items-center justify-between">
                  <span className="text-gray-300">{ruolo.nome}</span>
                  <input
                    type="number"
                    min={0}
                    value={config.rosa[ruolo.chiave as keyof typeof config.rosa]}
                    onChange={(e) =>
                      aggiornaConfig({
                        rosa: {
                          ...config.rosa,
                          [ruolo.chiave]: Number(e.target.value),
                        },
                      })
                    }
                    className="w-20 p-2 rounded bg-gray-800 text-white text-center border border-gray-700"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
            </div>
          </div>
        );
      case 6:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Regole</h2>
            <div className="space-y-4 mb-8">
              {[
                { nome: "Modificatore difesa", chiave: "modificatoreDifesa" },
                { nome: "Imbattibilità", chiave: "imbattibilita" },
                { nome: "Porta inviolata", chiave: "portaInviolata" },
                { nome: "Assist", chiave: "assist" },
                { nome: "Rigori", chiave: "rigori" },
              ].map((opzione) => (
                <div key={opzione.chiave} className="flex items-center justify-between">
                  <span className="text-gray-300">{opzione.nome}</span>
                  <button
                    onClick={() =>
                      aggiornaConfig({
                        regole: {
                          ...config.regole,
                          [opzione.chiave]: !config.regole[opzione.chiave as keyof LegaConfig["regole"]],
                        },
                      })
                    }
                    className={`w-14 h-8 rounded-full p-1 transition-colors ${
                      config.regole[opzione.chiave as keyof LegaConfig["regole"]]
                        ? "bg-green-600"
                        : "bg-gray-700"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full bg-white transform transition-transform ${
                        config.regole[opzione.chiave as keyof LegaConfig["regole"]]
                          ? "translate-x-6"
                          : ""
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="bg-orange-600 text-white px-6 py-2 rounded-lg">Avanti</button>
            </div>
          </div>
        );
      case 7:
        return (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Ordine asta</h2>
            <div className="space-y-4 mb-8">
              {[
                { nome: "Random per ruolo", chiave: "random" },
                { nome: "Libera", chiave: "libera" },
                { nome: "Manuale", chiave: "manuale" },
              ].map((opzione) => (
                <button
                  key={opzione.chiave}
                  onClick={() =>
                    aggiornaConfig({
                      ordineAsta: opzione.chiave as LegaConfig["ordineAsta"],
                    })
                  }
                  className={`w-full p-4 rounded-lg border ${
                    config.ordineAsta === opzione.chiave
                      ? "bg-green-600 border-green-400 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300"
                  }`}
                >
                  {opzione.nome}
                </button>
              ))}
            </div>
            <div className="flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button
                onClick={completaWizard}
                className="bg-orange-600 text-white px-6 py-2 rounded-lg"
              >
                Completa
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // ---- Vista: import ----
  const importView = (
    <div className="w-full max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-4">Importa Listone</h2>
      <label className="block mb-4">
        <span className="text-gray-300">Seleziona file Excel o CSV</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="mt-2 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-500"
        />
      </label>
      {fileName && <p className="text-green-400 mb-2">File caricato: {fileName}</p>}
      {message && <p className="text-green-400 mb-2">{message}</p>}
      {players.length > 0 && (
        <>
          <div className="mt-4">
            <p className="text-gray-300 mb-2">Anteprima (primi 5 giocatori):</p>
            <ul className="space-y-1">
              {players.slice(0, 5).map((player, index) => (
                <li key={index} className="text-sm text-gray-400">
                  {player["Nome"]} - {player["Ruolo"]}
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setView("dashboard")}
            className="mt-6 w-full rounded-lg bg-green-600 px-6 py-3 text-white font-semibold hover:bg-green-500 transition"
          >
            Vai alla Dashboard
          </button>
        </>
      )}
    </div>
  );

  // ---- Vista: dashboard ----
  const dashboardView = (
    <div className="w-full max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold text-green-500 mb-4">Dashboard Lega</h2>

      <div className="mb-6 space-y-2 text-sm text-gray-300">
        <p><span className="font-semibold">Partecipanti:</span> {config.partecipanti}</p>
        <p><span className="font-semibold">Budget:</span> {config.budget} crediti</p>
        <p><span className="font-semibold">Modalità:</span> {config.modalita === "classic" ? "Classic" : "Mantra"}</p>
        <p><span className="font-semibold">Rosa:</span> {config.rosa.portieri} P, {config.rosa.difensori} D, {config.rosa.centrocampisti} C, {config.rosa.attaccanti} A</p>
        <p><span className="font-semibold">Ordine asta:</span> {config.ordineAsta}</p>
      </div>

      <h3 className="text-lg font-semibold text-white mb-2">Giocatori importati ({players.length})</h3>
      {players.length > 0 ? (
        <ul className="max-h-60 overflow-y-auto space-y-1 text-sm text-gray-400">
          {players.slice(0, 20).map((player, index) => (
            <li key={index}>
              {player["Nome"]} - {player["Ruolo"]} - {player["Quotazione"]}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-500">Nessun giocatore importato.</p>
      )}

      <div className="mt-6 space-y-3">
        <button
          onClick={() => alert("Modalità Asta in arrivo!")}
          className="w-full rounded-lg bg-orange-600 px-6 py-3 text-white font-semibold hover:bg-orange-500 transition"
        >
          Modalità Asta
        </button>
        <button
          onClick={() => {
            localStorage.removeItem("legaconfig");
            localStorage.removeItem("listone");
            window.location.reload();
          }}
          className="w-full rounded-lg bg-gray-700 px-6 py-3 text-white font-semibold hover:bg-gray-600 transition"
        >
          Reimposta tutto
        </button>
      </div>
    </div>
  );

  // ---- Render principale ----
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      {view === "wizard" && <div className="w-full max-w-md">{contenutoPasso()}</div>}
      {view === "import" && importView}
      {view === "dashboard" && dashboardView}
    </main>
  );
}