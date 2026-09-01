"use client";

import { useState } from "react";

type Modalita = "classic" | "mantra";
type OrdineAsta = "random" | "libera" | "manuale";

interface RosaConfig {
  portieri: number;
  difensori: number;
  centrocampisti: number;
  attaccanti: number;
}

interface RegoleConfig {
  modificatoreDifesa: boolean;
  imbattibilita: boolean;
  portaInviolata: boolean;
  assist: boolean;
  rigori: boolean;
}

interface LegaConfig {
  partecipanti: number;
  budget: number;
  modalita: Modalita;
  rosa: RosaConfig;
  regole: RegoleConfig;
  ordineAsta: OrdineAsta;
}

const CONFIG_INIZIALE: LegaConfig = {
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

type View = "wizard" | "import";

export default function Home() {
  const [view, setView] = useState<View>("wizard");
  const [passo, setPasso] = useState(1);
  const [config, setConfig] = useState<LegaConfig>(CONFIG_INIZIALE);

  const vaiAvanti = () => {
    setPasso((precedente) => {
      if (precedente >= 7) {
        return 7;
      }

      return precedente + 1;
    });
  };

  const vaiIndietro = () => {
    setPasso((precedente) => {
      if (precedente <= 1) {
        return 1;
      }

      return precedente - 1;
    });
  };

  const aggiornaConfig = <K extends keyof LegaConfig>(
    chiave: K,
    valore: LegaConfig[K]
  ) => {
    setConfig((precedente) => ({
      ...precedente,
      [chiave]: valore,
    }));
  };

  const aggiornaRosa = <K extends keyof RosaConfig>(
    chiave: K,
    valore: number
  ) => {
    setConfig((precedente) => ({
      ...precedente,
      rosa: {
        ...precedente.rosa,
        [chiave]: valore,
      },
    }));
  };

  const aggiornaRegola = <K extends keyof RegoleConfig>(
    chiave: K,
    valore: boolean
  ) => {
    setConfig((precedente) => ({
      ...precedente,
      regole: {
        ...precedente.regole,
        [chiave]: valore,
      },
    }));
  };

  const completaWizard = () => {
    try {
      localStorage.setItem("fantai-legaconfig", JSON.stringify(config));
    } catch (errore) {
      console.error("Errore salvataggio configurazione:", errore);
    }

    setView("import");
  };

  const tornaAlWizard = () => {
    setView("wizard");
    setPasso(7);
  };

  if (view === "import") {
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8">
            <p className="text-sm font-medium text-green-500">
              CONFIGURAZIONE COMPLETATA
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Importa il listone
            </h1>

            <p className="mt-3 text-gray-400">
              La lega è stata configurata. Il prossimo passaggio sarà
              importare il listone dei giocatori.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h2 className="text-xl font-bold">
              Import listone
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              L'importazione Excel/CSV verrà collegata nel prossimo passaggio.
            </p>

            <div className="mt-6 rounded-xl bg-black p-4">
              <p className="text-sm text-gray-500">
                Partecipanti
              </p>

              <p className="mt-1 text-lg font-semibold">
                {config.partecipanti}
              </p>

              <p className="mt-4 text-sm text-gray-500">
                Budget
              </p>

              <p className="mt-1 text-lg font-semibold">
                {config.budget} crediti
              </p>

              <p className="mt-4 text-sm text-gray-500">
                Modalità
              </p>

              <p className="mt-1 text-lg font-semibold">
                {config.modalita === "classic"
                  ? "Classic"
                  : "Mantra"}
              </p>
            </div>

            <button
              type="button"
              onClick={tornaAlWizard}
              className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-800 px-5 py-3 font-semibold text-white active:scale-[0.98]"
            >
              Modifica configurazione
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white px-5 py-8">
      <div className="mx-auto w-full max-w-md">

        {/* HEADER */}

        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-orange-500">
            FANTAI AUCTION PRO
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Configura la tua lega
          </h1>

          <p className="mt-2 text-sm text-gray-400">
            Passo {passo} di 7
          </p>
        </div>

        {/* PROGRESS BAR */}

        <div className="mb-8 h-2 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-orange-600 transition-all duration-300"
            style={{
              width: `${(passo / 7) * 100}%`,
            }}
          />
        </div>

        {/* PASSO 1 */}

        {passo === 1 && (
          <section>
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6 text-center">
              <div className="mb-5 text-5xl">
                ⚽
              </div>

              <h2 className="text-2xl font-bold">
                Benvenuto in FantAI
              </h2>

              <p className="mt-4 leading-6 text-gray-400">
                FantAI Auction Pro ti aiuterà durante l'asta
                analizzando giocatori, budget, squadre e andamento
                dell'asta in tempo reale.
              </p>

              <button
                type="button"
                onClick={vaiAvanti}
                className="mt-8 w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-bold text-white shadow-lg active:scale-[0.98]"
              >
                Nuova Lega
              </button>
            </div>
          </section>
        )}

        {/* PASSO 2 */}

        {passo === 2 && (
          <section>
            <h2 className="text-2xl font-bold">
              Numero partecipanti
            </h2>

            <p className="mt-2 text-gray-400">
              Quante squadre partecipano alla lega?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              {[6, 8, 10, 12].map((numero) => (
                <button
                  key={numero}
                  type="button"
                  onClick={() =>
                    aggiornaConfig("partecipanti", numero)
                  }
                  className={`rounded-xl border p-5 text-xl font-bold ${
                    config.partecipanti === numero
                      ? "border-green-500 bg-green-600 text-white"
                      : "border-gray-700 bg-gray-900 text-gray-300"
                  }`}
                >
                  {numero}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={vaiIndietro}
                className="px-2 py-3 text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold text-white active:scale-[0.98]"
              >
                Avanti
              </button>
            </div>
          </section>
        )}

        {/* PASSO 3 */}

        {passo === 3 && (
          <section>
            <h2 className="text-2xl font-bold">
              Budget iniziale
            </h2>

            <p className="mt-2 text-gray-400">
              Quanti crediti ha ogni squadra?
            </p>

            <div className="mt-8">
              <label
                htmlFor="budget"
                className="mb-2 block text-sm text-gray-400"
              >
                Crediti
              </label>

              <input
                id="budget"
                type="number"
                min={1}
                inputMode="numeric"
                value={config.budget}
                onChange={(evento) =>
                  aggiornaConfig(
                    "budget",
                    Number(evento.target.value)
                  )
                }
                className="w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-2xl font-bold text-white outline-none focus:border-orange-500"
              />
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={vaiIndietro}
                className="px-2 py-3 text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold text-white active:scale-[0.98]"
              >
                Avanti
              </button>
            </div>
          </section>
        )}

        {/* PASSO 4 */}

        {passo === 4 && (
          <section>
            <h2 className="text-2xl font-bold">
              Modalità di gioco
            </h2>

            <p className="mt-2 text-gray-400">
              Scegli il sistema utilizzato nella tua lega.
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() =>
                  aggiornaConfig("modalita", "classic")
                }
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "classic"
                    ? "border-green-500 bg-green-600"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="text-lg font-bold">
                  Classic
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Sistema tradizionale con ruoli standard.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  aggiornaConfig("modalita", "mantra")
                }
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "mantra"
                    ? "border-green-500 bg-green-600"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="text-lg font-bold">
                  Mantra
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Sistema con ruoli e vincoli Mantra.
                </p>
              </button>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={vaiIndietro}
                className="px-2 py-3 text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold text-white active:scale-[0.98]"
              >
                Avanti
              </button>
            </div>
          </section>
        )}

        {/* PASSO 5 */}

        {passo === 5 && (
          <section>
            <h2 className="text-2xl font-bold">
              Composizione rosa
            </h2>

            <p className="mt-2 text-gray-400">
              Imposta il numero di giocatori per ruolo.
            </p>

            <div className="mt-6 space-y-3">
              {(
                [
                  ["portieri", "Portieri"],
                  ["difensori", "Difensori"],
                  ["centrocampisti", "Centrocampisti"],
                  ["attaccanti", "Attaccanti"],
                ] as const
              ).map(([chiave, nome]) => (
                <div
                  key={chiave}
                  className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4"
                >
                  <span className="font-medium text-gray-300">
                    {nome}
                  </span>

                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={config.rosa[chiave]}
                    onChange={(evento) =>
                      aggiornaRosa(
                        chiave,
                        Number(evento.target.value)
                      )
                    }
                    className="w-20 rounded-lg border border-gray-700 bg-gray-800 p-2 text-center text-lg font-bold text-white"
                  />
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={vaiIndietro}
                className="px-2 py-3 text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold text-white active:scale-[0.98]"
              >
                Avanti
              </button>
            </div>
          </section>
        )}

        {/* PASSO 6 */}

        {passo === 6 && (
          <section>
            <h2 className="text-2xl font-bold">
              Regole
            </h2>

            <p className="mt-2 text-gray-400">
              Seleziona le regole utilizzate nella tua lega.
            </p>

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
                    type="button"
                    onClick={() =>
                      aggiornaRegola(chiave, !attiva)
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4 text-left"
                  >
                    <span className="font-medium text-gray-300">
                      {nome}
                    </span>

                    <span
                      className={`relative h-7 w-12 rounded-full transition ${
                        attiva
                          ? "bg-green-600"
                          : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                          attiva
                            ? "left-6"
                            : "left-1"
                        }`}
                      />
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={vaiIndietro}
                className="px-2 py-3 text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold text-white active:scale-[0.98]"
              >
                Avanti
              </button>
            </div>
          </section>
        )}

        {/* PASSO 7 */}

        {passo === 7 && (
          <section>
            <h2 className="text-2xl font-bold">
              Ordine asta
            </h2>

            <p className="mt-2 text-gray-400">
              Come vuoi gestire l'ordine di chiamata?
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() =>
                  aggiornaConfig("ordineAsta", "random")
                }
                className={`w-full rounded-xl border p-5 text-left ${
                  config.ordineAsta === "random"
                    ? "border-green-500 bg-green-600"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">
                  Random per ruolo
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  L'ordine viene generato automaticamente.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  aggiornaConfig("ordineAsta", "libera")
                }
                className={`w-full rounded-xl border p-5 text-left ${
                  config.ordineAsta === "libera"
                    ? "border-green-500 bg-green-600"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">
                  Libera
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Puoi chiamare liberamente i giocatori.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  aggiornaConfig("ordineAsta", "manuale")
                }
                className={`w-full rounded-xl border p-5 text-left ${
                  config.ordineAsta === "manuale"
                    ? "border-green-500 bg-green-600"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">
                  Manuale
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Decidi manualmente l'ordine.
                </p>
              </button>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={vaiIndietro}
                className="px-2 py-3 text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={completaWizard}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold text-white active:scale-[0.98]"
              >
                Completa
              </button>
            </div>
          </section>
        )}

        {/* DEBUG TEMPORANEO */}

        <div className="mt-10 rounded-lg border border-gray-900 bg-gray-950 p-3 text-center">
          <p className="text-xs text-gray-600">
            Debug: view={view} · passo={passo}
          </p>
        </div>
      </div>
    </main>
  );
}