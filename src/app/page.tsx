"use client";

import { useState } from "react";

type Modalita = "classic" | "mantra";
type OrdineAsta = "random" | "libera" | "manuale";

interface LegaConfig {
  partecipanti: number;
  budget: number;
  modalita: Modalita;
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

export default function Home() {
  const [passo, setPasso] = useState(1);
  const [config, setConfig] =
    useState<LegaConfig>(CONFIG_INIZIALE);

  const vaiAvanti = () => {
    setPasso((precedente) =>
      precedente < 7 ? precedente + 1 : precedente
    );
  };

  const vaiIndietro = () => {
    setPasso((precedente) =>
      precedente > 1 ? precedente - 1 : precedente
    );
  };

  const aggiornaConfig = (
    modifiche: Partial<LegaConfig>
  ) => {
    setConfig((precedente) => ({
      ...precedente,
      ...modifiche,
    }));
  };

  const salvaConfigurazione = () => {
    localStorage.setItem(
      "fantai-legaconfig",
      JSON.stringify(config)
    );

    alert("Configurazione salvata!");
  };

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

        {/* PROGRESSO */}

        <div className="mb-8 h-2 rounded-full bg-gray-800">
          <div
            className="h-2 rounded-full bg-orange-600 transition-all"
            style={{
              width: `${(passo / 7) * 100}%`,
            }}
          />
        </div>

        {/* PASSO 1 */}

        {passo === 1 && (
          <section className="text-center">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">

              <div className="mb-5 text-5xl">
                ⚽
              </div>

              <h2 className="text-2xl font-bold">
                Benvenuto in FantAI
              </h2>

              <p className="mt-4 text-gray-400">
                Configura la tua lega per preparare
                FantAI all'asta.
              </p>

              <button
                type="button"
                onClick={vaiAvanti}
                className="mt-8 w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-bold active:scale-95"
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
              Quante squadre partecipano?
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">

              {[6, 8, 10, 12].map((numero) => (
                <button
                  key={numero}
                  type="button"
                  onClick={() =>
                    aggiornaConfig({
                      partecipanti: numero,
                    })
                  }
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

              <button
                type="button"
                onClick={vaiIndietro}
                className="text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold"
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
              Quanti crediti avrà ogni squadra?
            </p>

            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={config.budget}
              onChange={(e) =>
                aggiornaConfig({
                  budget: Number(e.target.value),
                })
              }
              className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-2xl font-bold"
            />

            <div className="mt-8 flex justify-between">

              <button
                type="button"
                onClick={vaiIndietro}
                className="text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold"
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
              Modalità
            </h2>

            <p className="mt-2 text-gray-400">
              Scegli la modalità della lega.
            </p>

            <div className="mt-6 space-y-3">

              <button
                type="button"
                onClick={() =>
                  aggiornaConfig({
                    modalita: "classic",
                  })
                }
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "classic"
                    ? "border-green-500 bg-green-600"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">
                  Classic
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Fantacalcio classico.
                </p>
              </button>

              <button
                type="button"
                onClick={() =>
                  aggiornaConfig({
                    modalita: "mantra",
                  })
                }
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "mantra"
                    ? "border-green-500 bg-green-600"
                    : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">
                  Mantra
                </p>

                <p className="mt-1 text-sm text-gray-300">
                  Sistema Mantra.
                </p>
              </button>

            </div>

            <div className="mt-8 flex justify-between">

              <button
                type="button"
                onClick={vaiIndietro}
                className="text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold"
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
              Imposta i giocatori per ruolo.
            </p>

            <div className="mt-6 space-y-3">

              {[
                ["portieri", "Portieri"],
                ["difensori", "Difensori"],
                ["centrocampisti", "Centrocampisti"],
                ["attaccanti", "Attaccanti"],
              ].map(([chiave, nome]) => (

                <div
                  key={chiave}
                  className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4"
                >

                  <span className="text-gray-300">
                    {nome}
                  </span>

                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={
                      config.rosa[
                        chiave as keyof LegaConfig["rosa"]
                      ]
                    }
                    onChange={(e) =>
                      setConfig((precedente) => ({
                        ...precedente,
                        rosa: {
                          ...precedente.rosa,
                          [chiave]:
                            Number(e.target.value),
                        },
                      }))
                    }
                    className="w-20 rounded-lg border border-gray-700 bg-gray-800 p-2 text-center font-bold"
                  />

                </div>

              ))}

            </div>

            <div className="mt-8 flex justify-between">

              <button
                type="button"
                onClick={vaiIndietro}
                className="text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold"
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
              Seleziona le regole della lega.
            </p>

            <div className="mt-6 space-y-3">

              {[
                ["modificatoreDifesa", "Modificatore difesa"],
                ["imbattibilita", "Imbattibilità"],
                ["portaInviolata", "Porta inviolata"],
                ["assist", "Assist"],
                ["rigori", "Rigori"],
              ].map(([chiave, nome]) => {

                const attiva =
                  config.regole[
                    chiave as keyof LegaConfig["regole"]
                  ];

                return (
                  <button
                    key={chiave}
                    type="button"
                    onClick={() =>
                      setConfig((precedente) => ({
                        ...precedente,
                        regole: {
                          ...precedente.regole,
                          [chiave]: !attiva,
                        },
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4"
                  >

                    <span className="text-gray-300">
                      {nome}
                    </span>

                    <span
                      className={`h-7 w-12 rounded-full p-1 ${
                        attiva
                          ? "bg-green-600"
                          : "bg-gray-700"
                      }`}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full bg-white transition-transform ${
                          attiva
                            ? "translate-x-5"
                            : ""
                        }`}
                      />
                    </span>

                  </button>
                );
              })}

            </div>

            <div className="mt-8 flex justify-between">

              <button
                type="button"
                onClick={vaiIndietro}
                className="text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={vaiAvanti}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold"
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
              Scegli come gestire l'ordine.
            </p>

            <div className="mt-6 space-y-3">

              {[
                ["random", "Random per ruolo"],
                ["libera", "Libera"],
                ["manuale", "Manuale"],
              ].map(([valore, nome]) => (

                <button
                  key={valore}
                  type="button"
                  onClick={() =>
                    aggiornaConfig({
                      ordineAsta:
                        valore as OrdineAsta,
                    })
                  }
                  className={`w-full rounded-xl border p-5 text-left ${
                    config.ordineAsta === valore
                      ? "border-green-500 bg-green-600"
                      : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <p className="font-bold">
                    {nome}
                  </p>
                </button>

              ))}

            </div>

            <div className="mt-8 flex justify-between">

              <button
                type="button"
                onClick={vaiIndietro}
                className="text-gray-400 underline"
              >
                Indietro
              </button>

              <button
                type="button"
                onClick={salvaConfigurazione}
                className="rounded-xl bg-orange-600 px-7 py-3 font-bold"
              >
                Completa
              </button>

            </div>

          </section>
        )}

        {/* DEBUG */}

        <div className="mt-10 rounded-lg border border-gray-900 bg-gray-950 p-3 text-center">
          <p className="text-xs text-gray-600">
            Passo attuale: {passo}
          </p>
        </div>

      </div>
    </main>
  );
}