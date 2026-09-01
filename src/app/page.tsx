"use client";

import { useState } from "react";
import ImportListone from "@/components/ImportListone";

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
    assist: true,
    rigori: true,
  },
  ordineAsta: "random",
};

export default function Home() {
  const [view, setView] = useState<"wizard" | "import" | "dashboard">("wizard");
  const [passo, setPasso] = useState(1);
  const [config, setConfig] = useState<LegaConfig>(configIniziale);
  const [giocatori, setGiocatori] = useState<any[]>([]);

  const vaiAvanti = () => setPasso((p) => Math.min(p + 1, 7));
  const vaiIndietro = () => setPasso((p) => Math.max(p - 1, 1));

  const aggiornaConfig = (modifiche: Partial<LegaConfig>) => {
    setConfig((prev) => ({ ...prev, ...modifiche }));
  };

  const salvaConfigurazione = () => {
    localStorage.setItem("fantai-legaconfig", JSON.stringify(config));
    setView("import");
  };

  const handleImportComplete = (players: any[]) => {
    setGiocatori(players);
    localStorage.setItem("fantai-giocatori", JSON.stringify(players));
    setView("dashboard");
  };

  // ---------- VISTA DASHBOARD ----------
  if (view === "dashboard") {
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-2xl font-bold text-green-400">Dashboard</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p><span className="font-semibold">Partecipanti:</span> {config.partecipanti}</p>
              <p><span className="font-semibold">Budget:</span> {config.budget} crediti</p>
              <p><span className="font-semibold">Modalità:</span> {config.modalita === "classic" ? "Classic" : "Mantra"}</p>
              <p><span className="font-semibold">Giocatori importati:</span> {giocatori.length}</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-lg font-bold mb-3">Primi 20 giocatori</h3>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {giocatori.slice(0, 20).map((g, i) => (
                <li key={i} className="flex justify-between text-sm text-gray-300">
                  <span>{g.nome}</span>
                  <span>{g.squadra || "-"}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => alert("Modalità Asta in arrivo!")}
            className="mt-6 w-full rounded-xl bg-orange-600 px-6 py-4 font-bold text-white"
          >
            Modalità Asta (presto)
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("fantai-legaconfig");
              localStorage.removeItem("fantai-giocatori");
              window.location.reload();
            }}
            className="mt-3 w-full rounded-xl bg-gray-700 px-6 py-3 font-semibold text-white"
          >
            Reimposta tutto
          </button>
        </div>
      </main>
    );
  }

  // ---------- VISTA IMPORT ----------
  if (view === "import") {
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <ImportListone onComplete={handleImportComplete} />
          <button
            onClick={() => {
              setView("wizard");
              setPasso(7);
            }}
            className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 font-semibold text-white active:scale-[0.98]"
          >
            Modifica configurazione
          </button>
        </div>
      </main>
    );
  }

  // ---------- VISTA WIZARD ----------
  return (
    <main className="min-h-screen bg-black text-white px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-orange-500">
            FANTAI AUCTION PRO
          </p>
          <h1 className="mt-2 text-3xl font-bold">Configura la tua lega</h1>
          <p className="mt-2 text-sm text-gray-400">Passo {passo} di 7</p>
        </div>

        <div className="mb-8 h-2 rounded-full bg-gray-800">
          <div
            className="h-2 rounded-full bg-orange-600 transition-all"
            style={{ width: `${(passo / 7) * 100}%` }}
          />
        </div>

        {passo === 1 && (
          <section className="text-center">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <div className="mb-5 text-5xl">⚽</div>
              <h2 className="text-2xl font-bold">Benvenuto in FantAI</h2>
              <p className="mt-4 text-gray-400">Configura la tua lega per preparare FantAI all'asta.</p>
              <button
                onClick={vaiAvanti}
                className="mt-8 w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-bold active:scale-95"
              >
                Nuova Lega
              </button>
            </div>
          </section>
        )}

        {passo === 2 && (
          <section>
            <h2 className="text-2xl font-bold">Numero partecipanti</h2>
            <p className="mt-2 text-gray-400">Quante squadre partecipano?</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[6, 8, 10, 12].map((numero) => (
                <button
                  key={numero}
                  onClick={() => aggiornaConfig({ partecipanti: numero })}
                  className={`rounded-xl border p-5 text-xl font-bold ${
                    config.partecipanti === numero
                      ? "border-green-500 bg-green-600"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  {numero}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 3 && (
          <section>
            <h2 className="text-2xl font-bold">Budget iniziale</h2>
            <p className="mt-2 text-gray-400">Quanti crediti avrà ogni squadra?</p>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={config.budget}
              onChange={(e) => aggiornaConfig({ budget: Number(e.target.value) })}
              className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-2xl font-bold text-white"
            />
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 4 && (
          <section>
            <h2 className="text-2xl font-bold">Modalità</h2>
            <p className="mt-2 text-gray-400">Scegli la modalità della lega.</p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => aggiornaConfig({ modalita: "classic" })}
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "classic" ? "border-green-500 bg-green-600" : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">Classic</p>
              </button>
              <button
                onClick={() => aggiornaConfig({ modalita: "mantra" })}
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "mantra" ? "border-green-500 bg-green-600" : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">Mantra</p>
              </button>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 5 && (
          <section>
            <h2 className="text-2xl font-bold">Composizione rosa</h2>
            <p className="mt-2 text-gray-400">Imposta i giocatori per ruolo.</p>
            <div className="mt-6 space-y-3">
              {(
                [
                  ["portieri", "Portieri"],
                  ["difensori", "Difensori"],
                  ["centrocampisti", "Centrocampisti"],
                  ["attaccanti", "Attaccanti"],
                ] as const
              ).map(([chiave, nome]) => (
                <div key={chiave} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <span className="text-gray-300">{nome}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={config.rosa[chiave]}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        rosa: {
                          ...prev.rosa,
                          [chiave]: Number(e.target.value),
                        },
                      }))
                    }
                    className="w-20 rounded-lg border border-gray-700 bg-gray-800 p-2 text-center font-bold"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 6 && (
          <section>
            <h2 className="text-2xl font-bold">Regole</h2>
            <p className="mt-2 text-gray-400">Seleziona le regole della lega.</p>
            <div className="mt-6 space-y-3">
              {(
                [
                  ["modificatoreDifesa", "Modificatore difesa"],
                  ["imbattibilita", "Imbattibilità"],
                  ["portaInviolata", "Porta inviolata"],
                  ["assist", "Assist"],
                  ["rigori", "Rigori"],
                ] as const
              ).map(([chiave, nome]) => {
                const attiva = config.regole[chiave];
                return (
                  <button
                    key={chiave}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        regole: {
                          ...prev.regole,
                          [chiave]: !attiva,
                        },
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4"
                  >
                    <span className="text-gray-300">{nome}</span>
                    <span className={`h-7 w-12 rounded-full p-1 ${attiva ? "bg-green-600" : "bg-gray-700"}`}>
                      <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${attiva ? "translate-x-5" : ""}`} />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 7 && (
          <section>
            <h2 className="text-2xl font-bold">Ordine asta</h2>
            <p className="mt-2 text-gray-400">Scegli come gestire l'ordine.</p>
            <div className="mt-6 space-y-3">
              {(
                [
                  ["random", "Random per ruolo"],
                  ["libera", "Libera"],
                  ["manuale", "Manuale"],
                ] as const
              ).map(([valore, nome]) => (
                <button
                  key={valore}
                  onClick={() => aggiornaConfig({ ordineAsta: valore as LegaConfig["ordineAsta"] })}
                  className={`w-full rounded-xl border p-5 text-left ${
                    config.ordineAsta === valore ? "border-green-500 bg-green-600" : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <p className="font-bold">{nome}</p>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={salvaConfigurazione} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Completa</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}