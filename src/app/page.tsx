"use client";

import { ChangeEvent, useState } from "react";
import * as XLSX from "xlsx";

type Modalita = "classic" | "mantra";
type OrdineAsta = "random" | "libera" | "manuale";

type View = "wizard" | "import";

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

interface Giocatore {
  nome: string;
  ruolo: string;
  squadra: string;
  quotazione: string;
  [key: string]: string;
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

function normalizzaTesto(valore: unknown): string {
  return String(valore ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function trovaColonna(
  intestazioni: string[],
  possibiliNomi: string[]
): string | null {
  const normalizzate = possibiliNomi.map(normalizzaTesto);

  for (const intestazione of intestazioni) {
    const normalizzata = normalizzaTesto(intestazione);

    if (normalizzate.includes(normalizzata)) {
      return intestazione;
    }
  }

  for (const intestazione of intestazioni) {
    const normalizzata = normalizzaTesto(intestazione);

    if (
      normalizzate.some(
        (nome) =>
          normalizzata.includes(nome) ||
          nome.includes(normalizzata)
      )
    ) {
      return intestazione;
    }
  }

  return null;
}

function valoreCella(
  riga: Record<string, unknown>,
  colonna: string | null
): string {
  if (!colonna) {
    return "";
  }

  return String(riga[colonna] ?? "").trim();
}

export default function Home() {
  const [view, setView] = useState<View>("wizard");

  const [passo, setPasso] = useState(1);

  const [config, setConfig] =
    useState<LegaConfig>(CONFIG_INIZIALE);

  const [giocatori, setGiocatori] =
    useState<Giocatore[]>([]);

  const [nomeFile, setNomeFile] =
    useState("");

  const [erroreImport, setErroreImport] =
    useState("");

  const [caricamento, setCaricamento] =
    useState(false);

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
    try {
      localStorage.setItem(
        "fantai-legaconfig",
        JSON.stringify(config)
      );
    } catch (errore) {
      console.error(
        "Errore salvataggio configurazione:",
        errore
      );
    }

    setView("import");
  };

  const gestisciImport = async (
    evento: ChangeEvent<HTMLInputElement>
  ) => {
    const file = evento.target.files?.[0];

    if (!file) {
      return;
    }

    setErroreImport("");
    setCaricamento(true);
    setGiocatori([]);
    setNomeFile(file.name);

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
      });

      if (!workbook.SheetNames.length) {
        throw new Error(
          "Il file non contiene fogli."
        );
      }

      const primoFoglio =
        workbook.Sheets[workbook.SheetNames[0]];

      const righe = XLSX.utils.sheet_to_json<
        Record<string, unknown>
      >(primoFoglio, {
        defval: "",
      });

      if (!righe.length) {
        throw new Error(
          "Il file non contiene dati."
        );
      }

      const intestazioni = Object.keys(righe[0]);

      const colonnaNome = trovaColonna(
        intestazioni,
        [
          "nome",
          "nome giocatore",
          "giocatore",
          "calciatore",
          "player",
          "name",
          "nome calciatore",
        ]
      );

      const colonnaRuolo = trovaColonna(
        intestazioni,
        [
          "ruolo",
          "ruoli",
          "role",
          "posizione",
          "position",
        ]
      );

      const colonnaSquadra = trovaColonna(
        intestazioni,
        [
          "squadra",
          "team",
          "club",
          "societa",
        ]
      );

      const colonnaQuotazione = trovaColonna(
        intestazioni,
        [
          "quotazione",
          "quot",
          "quotazione iniziale",
          "prezzo",
          "valore",
          "quotazione fantacalcio",
          "initial price",
        ]
      );

      if (!colonnaNome) {
        throw new Error(
          "Non riesco a individuare la colonna del nome del giocatore."
        );
      }

      const risultati: Giocatore[] = righe
        .map((riga) => {
          const nome = valoreCella(
            riga,
            colonnaNome
          );

          if (!nome) {
            return null;
          }

          const giocatore: Giocatore = {
            nome,
            ruolo: valoreCella(
              riga,
              colonnaRuolo
            ),
            squadra: valoreCella(
              riga,
              colonnaSquadra
            ),
            quotazione: valoreCella(
              riga,
              colonnaQuotazione
            ),
          };

          for (const intestazione of intestazioni) {
            if (
              !Object.prototype.hasOwnProperty.call(
                giocatore,
                intestazione
              )
            ) {
              giocatore[intestazione] =
                String(
                  riga[intestazione] ?? ""
                ).trim();
            }
          }

          return giocatore;
        })
        .filter(
          (giocatore): giocatore is Giocatore =>
            giocatore !== null
        );

      if (!risultati.length) {
        throw new Error(
          "Non è stato possibile estrarre nessun giocatore."
        );
      }

      setGiocatori(risultati);

      try {
        localStorage.setItem(
          "fantai-giocatori",
          JSON.stringify(risultati)
        );
      } catch (errore) {
        console.error(
          "Errore salvataggio giocatori:",
          errore
        );
      }
    } catch (errore) {
      console.error(
        "Errore importazione:",
        errore
      );

      setErroreImport(
        errore instanceof Error
          ? errore.message
          : "Errore durante l'importazione del file."
      );
    } finally {
      setCaricamento(false);

      evento.target.value = "";
    }
  };

  if (view === "import") {
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md">

          <div className="mb-8">
            <p className="text-xs font-semibold tracking-widest text-orange-500">
              FANTAI AUCTION PRO
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              Importa il listone
            </h1>

            <p className="mt-3 text-gray-400">
              Carica il file Excel o CSV del tuo
              fantacalcio.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">

            <label
              htmlFor="file-listone"
              className="block cursor-pointer rounded-xl border-2 border-dashed border-gray-700 bg-gray-950 p-8 text-center active:scale-[0.99]"
            >
              <div className="text-4xl">
                📄
              </div>

              <p className="mt-4 font-bold">
                Seleziona listone
              </p>

              <p className="mt-2 text-sm text-gray-500">
                XLSX, XLS oppure CSV
              </p>
            </label>

            <input
              id="file-listone"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={gestisciImport}
              className="hidden"
            />

            {nomeFile && (
              <div className="mt-4 rounded-xl bg-black p-4">
                <p className="text-xs text-gray-500">
                  File selezionato
                </p>

                <p className="mt-1 break-all font-medium">
                  {nomeFile}
                </p>
              </div>
            )}

            {caricamento && (
              <div className="mt-5 rounded-xl bg-orange-950 p-4 text-center">
                <p className="font-semibold text-orange-400">
                  Importazione in corso...
                </p>
              </div>
            )}

            {erroreImport && (
              <div className="mt-5 rounded-xl border border-red-900 bg-red-950 p-4">
                <p className="font-semibold text-red-400">
                  Errore
                </p>

                <p className="mt-2 text-sm text-red-300">
                  {erroreImport}
                </p>
              </div>
            )}

          </div>

          {giocatori.length > 0 && (
            <section className="mt-6">

              <div className="rounded-2xl border border-green-900 bg-green-950 p-5">

                <p className="text-sm text-green-400">
                  Importazione completata
                </p>

                <p className="mt-1 text-3xl font-bold">
                  {giocatori.length}
                </p>

                <p className="text-sm text-gray-400">
                  giocatori importati
                </p>

              </div>

              <div className="mt-5 rounded-2xl border border-gray-800 bg-gray-900 p-5">

                <h2 className="text-xl font-bold">
                  Anteprima
                </h2>

                <div className="mt-4 space-y-3">

                  {giocatori
                    .slice(0, 10)
                    .map((giocatore, indice) => (
                      <div
                        key={`${giocatore.nome}-${indice}`}
                        className="rounded-xl bg-black p-4"
                      >
                        <p className="font-bold">
                          {giocatore.nome}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2 text-xs">
                          {giocatore.ruolo && (
                            <span className="rounded-full bg-gray-800 px-3 py-1 text-gray-300">
                              {giocatore.ruolo}
                            </span>
                          )}

                          {giocatore.squadra && (
                            <span className="rounded-full bg-gray-800 px-3 py-1 text-gray-300">
                              {giocatore.squadra}
                            </span>
                          )}

                          {giocatore.quotazione && (
                            <span className="rounded-full bg-orange-900 px-3 py-1 text-orange-300">
                              Quot. {giocatore.quotazione}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}

                </div>

                {giocatori.length > 10 && (
                  <p className="mt-4 text-center text-sm text-gray-500">
                    Mostrati i primi 10 giocatori.
                  </p>
                )}

              </div>

              <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">

                <h2 className="text-lg font-bold">
                  Configurazione lega
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-3">

                  <div className="rounded-xl bg-black p-3">
                    <p className="text-xs text-gray-500">
                      Partecipanti
                    </p>

                    <p className="mt-1 font-bold">
                      {config.partecipanti}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black p-3">
                    <p className="text-xs text-gray-500">
                      Budget
                    </p>

                    <p className="mt-1 font-bold">
                      {config.budget}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black p-3">
                    <p className="text-xs text-gray-500">
                      Modalità
                    </p>

                    <p className="mt-1 font-bold">
                      {config.modalita === "classic"
                        ? "Classic"
                        : "Mantra"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-black p-3">
                    <p className="text-xs text-gray-500">
                      Ordine
                    </p>

                    <p className="mt-1 font-bold">
                      {config.ordineAsta}
                    </p>
                  </div>

                </div>

              </div>

            </section>
          )}

          <button
            type="button"
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

  return (
    <main className="min-h-screen bg-black text-white px-5 py-8">
      <div className="mx-auto w-full max-w-md">

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

        <div className="mb-8 h-2 rounded-full bg-gray-800">
          <div
            className="h-2 rounded-full bg-orange-600 transition-all"
            style={{
              width: `${(passo / 7) * 100}%`,
            }}
          />
        </div>

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
              className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-2xl font-bold text-white"
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

        {passo === 5 && (
          <section>

            <h2 className="text-2xl font-bold">
              Composizione rosa
            </h2>

            <p className="mt-2 text-gray-400">
              Imposta i giocatori per ruolo.
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

                  <span className="text-gray-300">
                    {nome}
                  </span>

                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={
                      config.rosa[chiave]
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

        {passo === 6 && (
          <section>

            <h2 className="text-2xl font-bold">
              Regole
            </h2>

            <p className="mt-2 text-gray-400">
              Seleziona le regole della lega.
            </p>

            <div className="mt-6 space-y-3">

              {(
                [
                  [
                    "modificatoreDifesa",
                    "Modificatore difesa",
                  ],
                  [
                    "imbattibilita",
                    "Imbattibilità",
                  ],
                  [
                    "portaInviolata",
                    "Porta inviolata",
                  ],
                  ["assist", "Assist"],
                  ["rigori", "Rigori"],
                ] as const
              ).map(([chiave, nome]) => {

                const attiva =
                  config.regole[chiave];

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

        {passo === 7 && (
          <section>

            <h2 className="text-2xl font-bold">
              Ordine asta
            </h2>

            <p className="mt-2 text-gray-400">
              Scegli come gestire l'ordine.
            </p>

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

        <div className="mt-10 rounded-lg border border-gray-900 bg-gray-950 p-3 text-center">
          <p className="text-xs text-gray-600">
            Passo attuale: {passo}
          </p>
        </div>

      </div>
    </main>
  );
}