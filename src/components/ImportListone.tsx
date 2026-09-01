"use client";

import { useState, type ChangeEvent } from "react";
import * as XLSX from "xlsx";

interface Giocatore {
  nome: string;
  squadra: string;
  ruolo: string;
  ruoloMantra: string;
  quotazione: number | null;
  quotazioneAttuale: number | null;
  fvm: number | null;
}

interface ImportListoneProps {
  onImport?: (giocatori: Giocatore[]) => void;
}

function normalizza(valore: unknown): string {
  return String(valore ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function testo(valore: unknown): string {
  return String(valore ?? "").trim();
}

function numero(valore: unknown): number | null {
  if (valore === null || valore === undefined || valore === "") {
    return null;
  }

  if (typeof valore === "number") {
    return Number.isFinite(valore) ? valore : null;
  }

  let stringa = String(valore).trim();

  stringa = stringa.replace(/[^\d,.-]/g, "");

  if (stringa.includes(",") && stringa.includes(".")) {
    if (stringa.lastIndexOf(",") > stringa.lastIndexOf(".")) {
      stringa = stringa.replace(/\./g, "").replace(",", ".");
    } else {
      stringa = stringa.replace(/,/g, "");
    }
  } else {
    stringa = stringa.replace(",", ".");
  }

  const risultato = Number(stringa);

  return Number.isFinite(risultato) ? risultato : null;
}

function trovaColonna(
  intestazioni: string[],
  nomi: string[]
): number {
  const normalizzate = intestazioni.map(normalizza);

  for (const nome of nomi) {
    const target = normalizza(nome);

    const indice = normalizzate.findIndex(
      (colonna) => colonna === target
    );

    if (indice !== -1) {
      return indice;
    }
  }

  for (const nome of nomi) {
    const target = normalizza(nome);

    const indice = normalizzate.findIndex(
      (colonna) =>
        colonna.includes(target) ||
        target.includes(colonna)
    );

    if (indice !== -1) {
      return indice;
    }
  }

  return -1;
}

function trovaIntestazione(
  righe: unknown[][]
): {
  indice: number;
  colonne: string[];
} | null {
  let migliore: {
    indice: number;
    colonne: string[];
    punteggio: number;
  } | null = null;

  const massimo = Math.min(righe.length, 50);

  for (let r = 0; r < massimo; r++) {
    const riga = righe[r];

    if (!Array.isArray(riga)) {
      continue;
    }

    const colonne = riga.map((cella) => testo(cella));

    let punteggio = 0;

    for (const colonna of colonne) {
      const c = normalizza(colonna);

      if (
        c === "calciatore" ||
        c === "giocatore" ||
        c === "nome"
      ) {
        punteggio += 10;
      }

      if (
        c === "sq" ||
        c === "squadra" ||
        c === "team"
      ) {
        punteggio += 5;
      }

      if (
        c === "qi" ||
        c === "quotazione iniziale"
      ) {
        punteggio += 5;
      }

      if (
        c === "qa" ||
        c === "quotazione attuale"
      ) {
        punteggio += 5;
      }

      if (c === "fvm") {
        punteggio += 5;
      }

      if (
        c === "ruolo" ||
        c === "role" ||
        c === "r"
      ) {
        punteggio += 4;
      }
    }

    if (
      migliore === null ||
      punteggio > migliore.punteggio
    ) {
      migliore = {
        indice: r,
        colonne,
        punteggio,
      };
    }
  }

  if (migliore === null) {
    return null;
  }

  return {
    indice: migliore.indice,
    colonne: migliore.colonne,
  };
}

function estraiDaFoglio(
  foglio: XLSX.WorkSheet
): Giocatore[] {
  const righe = XLSX.utils.sheet_to_json<unknown[][]>(
    foglio,
    {
      header: 1,
      defval: "",
      raw: true,
    }
  );

  if (righe.length === 0) {
    return [];
  }

  const informazioni = trovaIntestazione(righe);

  if (informazioni === null) {
    return [];
  }

  const indiceIntestazione =
    informazioni.indice;

  const colonne = informazioni.colonne;

  let indiceNome = trovaColonna(
    colonne,
    [
      "Calciatore",
      "Giocatore",
      "Nome",
      "Nome calciatore",
      "Player",
    ]
  );

  const indiceSquadra = trovaColonna(
    colonne,
    [
      "Sq",
      "Squadra",
      "Team",
      "Club",
    ]
  );

  const indiceRuolo = trovaColonna(
    colonne,
    [
      "Ruolo",
      "Role",
      "R",
    ]
  );

  const indiceQI = trovaColonna(
    colonne,
    [
      "QI",
      "Quotazione iniziale",
    ]
  );

  const indiceQA = trovaColonna(
    colonne,
    [
      "QA",
      "Quotazione attuale",
    ]
  );

  const indiceFVM = trovaColonna(
    colonne,
    [
      "FVM",
      "FVM / 1000",
      "Fantavalore di mercato",
      "Fantavalore",
    ]
  );

  /*
   * Se la colonna nome non viene trovata,
   * cerchiamo automaticamente la prima colonna
   * che contiene valori testuali compatibili
   * con nomi di calciatori.
   */
  if (indiceNome === -1) {
    let migliorIndice = -1;
    let migliorPunteggio = 0;

    const numeroColonne = colonne.length;

    for (let c = 0; c < numeroColonne; c++) {
      let punteggio = 0;

      for (
        let r = indiceIntestazione + 1;
        r < Math.min(righe.length, indiceIntestazione + 100);
        r++
      ) {
        const valore = testo(righe[r]?.[c]);

        if (
          valore.length >= 3 &&
          valore.length <= 50 &&
          /[A-Za-zÀ-ÿ]/.test(valore)
        ) {
          if (
            !/^\d+$/.test(valore) &&
            !/^(sq|qi|qa|fvm)$/i.test(valore)
          ) {
            punteggio++;
          }
        }
      }

      if (punteggio > migliorPunteggio) {
        migliorPunteggio = punteggio;
        migliorIndice = c;
      }
    }

    indiceNome = migliorIndice;
  }

  if (indiceNome === -1) {
    return [];
  }

  const giocatori: Giocatore[] = [];

  for (
    let r = indiceIntestazione + 1;
    r < righe.length;
    r++
  ) {
    const riga = righe[r];

    if (!Array.isArray(riga)) {
      continue;
    }

    const nome = testo(riga[indiceNome]);

    if (!nome) {
      continue;
    }

    const nomeNorm = normalizza(nome);

    const valoriNonGiocatore = [
      "calciatore",
      "giocatore",
      "nome",
      "totale",
      "media",
      "quotazione",
      "fvm",
      "fantavalore",
      "squadra",
      "team",
    ];

    if (valoriNonGiocatore.includes(nomeNorm)) {
      continue;
    }

    const squadra =
      indiceSquadra !== -1
        ? testo(riga[indiceSquadra])
        : "";

    const ruolo =
      indiceRuolo !== -1
        ? testo(riga[indiceRuolo])
        : "";

    const quotazione =
      indiceQI !== -1
        ? numero(riga[indiceQI])
        : null;

    const quotazioneAttuale =
      indiceQA !== -1
        ? numero(riga[indiceQA])
        : null;

    const fvm =
      indiceFVM !== -1
        ? numero(riga[indiceFVM])
        : null;

    /*
     * Alcune versioni del listone possono avere
     * una struttura con più colonne ruolo/quotazioni.
     * Non scartiamo il giocatore se alcune informazioni
     * sono mancanti.
     */
    const haInformazioniUtili =
      squadra !== "" ||
      ruolo !== "" ||
      quotazione !== null ||
      quotazioneAttuale !== null ||
      fvm !== null;

    if (!haInformazioniUtili) {
      continue;
    }

    giocatori.push({
      nome,
      squadra,
      ruolo,
      ruoloMantra: "",
      quotazione,
      quotazioneAttuale,
      fvm,
    });
  }

  return giocatori;
}

function ordinaGiocatori(
  giocatori: Giocatore[]
): Giocatore[] {
  return [...giocatori].sort((a, b) =>
    a.nome.localeCompare(
      b.nome,
      "it"
    )
  );
}

export default function ImportListone({
  onImport,
}: ImportListoneProps) {
  const [giocatori, setGiocatori] =
    useState<Giocatore[]>([]);

  const [nomeFile, setNomeFile] =
    useState("");

  const [errore, setErrore] =
    useState("");

  const [caricamento, setCaricamento] =
    useState(false);

  const [foglioUsato, setFoglioUsato] =
    useState("");

  const gestisciFile = async (
    evento: ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      evento.target.files?.[0];

    if (!file) {
      return;
    }

    setNomeFile(file.name);
    setErrore("");
    setGiocatori([]);
    setFoglioUsato("");
    setCaricamento(true);

    try {
      const buffer =
        await file.arrayBuffer();

      const workbook =
        XLSX.read(buffer, {
          type: "array",
          cellDates: true,
        });

      if (
        !workbook.SheetNames ||
        workbook.SheetNames.length === 0
      ) {
        throw new Error(
          "Il file non contiene fogli leggibili."
        );
      }

      let migliorRisultato: Giocatore[] = [];
      let migliorFoglio = "";

      for (
        const nomeFoglio
        of workbook.SheetNames
      ) {
        const foglio =
          workbook.Sheets[nomeFoglio];

        if (!foglio) {
          continue;
        }

        const risultato =
          estraiDaFoglio(foglio);

        if (
          risultato.length >
          migliorRisultato.length
        ) {
          migliorRisultato =
            risultato;

          migliorFoglio =
            nomeFoglio;
        }
      }

      if (
        migliorRisultato.length === 0
      ) {
        throw new Error(
          "Non sono riuscito a riconoscere i calciatori nel listone. Il file è stato aperto correttamente, ma la struttura delle righe non è stata riconosciuta."
        );
      }

      const ordinati =
        ordinaGiocatori(
          migliorRisultato
        );

      setGiocatori(ordinati);
      setFoglioUsato(migliorFoglio);

      if (onImport) {
        onImport(ordinati);
      }
    } catch (error) {
      console.error(
        "Errore importazione:",
        error
      );

      if (
        error instanceof Error
      ) {
        setErrore(error.message);
      } else {
        setErrore(
          "Errore durante la lettura del file."
        );
      }
    } finally {
      setCaricamento(false);

      /*
       * Permette di selezionare nuovamente
       * lo stesso file dopo un errore.
       */
      evento.target.value = "";
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 sm:p-6">

        <h2 className="mb-2 text-2xl font-bold text-white">
          Importa Listone
        </h2>

        <p className="mb-6 text-sm leading-6 text-gray-400">
          Carica il listone ufficiale
          Fantacalcio in formato Excel
          oppure CSV. FantAI analizzerà
          automaticamente le colonne
          disponibili.
        </p>

        <label className="block cursor-pointer">
          <div className="rounded-2xl border-2 border-dashed border-gray-700 bg-gray-800 p-7 text-center transition active:scale-[0.99]">

            <div className="mb-3 text-4xl">
              📄
            </div>

            <div className="text-lg font-bold text-white">
              {caricamento
                ? "Analisi del listone..."
                : "Seleziona il listone"}
            </div>

            <div className="mt-2 text-xs text-gray-400">
              XLSX, XLS o CSV
            </div>

          </div>

          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={gestisciFile}
            disabled={caricamento}
            className="hidden"
          />
        </label>

        {nomeFile !== "" && (
          <div className="mt-4 rounded-xl border border-gray-800 bg-gray-950 p-4">

            <p className="text-xs text-gray-500">
              File selezionato
            </p>

            <p className="mt-1 break-all font-semibold text-white">
              {nomeFile}
            </p>

          </div>
        )}

        {caricamento && (
          <div className="mt-5 rounded-xl border border-orange-800 bg-orange-950/30 p-4">

            <p className="font-semibold text-orange-400">
              Sto analizzando il file...
            </p>

            <p className="mt-1 text-sm text-orange-300">
              Non chiudere questa pagina.
            </p>

          </div>
        )}

        {errore !== "" && (
          <div className="mt-5 rounded-xl border border-red-800 bg-red-950/40 p-4">

            <p className="font-bold text-red-400">
              Importazione non riuscita
            </p>

            <p className="mt-2 text-sm leading-6 text-red-300">
              {errore}
            </p>

          </div>
        )}

        {giocatori.length > 0 && (
          <div className="mt-6">

            <div className="rounded-xl border border-green-800 bg-green-950/30 p-4">

              <p className="font-bold text-green-400">
                Listone importato correttamente
              </p>

              <p className="mt-1 text-sm text-green-300">
                Trovati{" "}
                <strong>
                  {giocatori.length}
                </strong>{" "}
                calciatori.
              </p>

              {foglioUsato !== "" && (
                <p className="mt-1 text-xs text-green-400/70">
                  Foglio utilizzato:{" "}
                  {foglioUsato}
                </p>
              )}

            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-gray-800">

              <div className="max-h-[420px] overflow-auto">

                <table className="w-full min-w-[650px] text-left text-sm">

                  <thead className="sticky top-0 z-10 bg-gray-800 text-gray-300">

                    <tr>
                      <th className="px-3 py-3">
                        Calciatore
                      </th>

                      <th className="px-3 py-3">
                        Sq
                      </th>

                      <th className="px-3 py-3">
                        Ruolo
                      </th>

                      <th className="px-3 py-3">
                        QI
                      </th>

                      <th className="px-3 py-3">
                        QA
                      </th>

                      <th className="px-3 py-3">
                        FVM
                      </th>
                    </tr>

                  </thead>

                  <tbody>

                    {giocatori
                      .slice(0, 100)
                      .map(
                        (
                          giocatore,
                          indice
                        ) => (
                          <tr
                            key={`${giocatore.nome}-${giocatore.squadra}-${indice}`}
                            className="border-t border-gray-800"
                          >

                            <td className="px-3 py-3 font-semibold text-white">
                              {giocatore.nome}
                            </td>

                            <td className="px-3 py-3 text-gray-300">
                              {giocatore.squadra || "-"}
                            </td>

                            <td className="px-3 py-3 text-gray-300">
                              {giocatore.ruolo || "-"}
                            </td>

                            <td className="px-3 py-3 text-gray-300">
                              {giocatore.quotazione ?? "-"}
                            </td>

                            <td className="px-3 py-3 text-gray-300">
                              {giocatore.quotazioneAttuale ?? "-"}
                            </td>

                            <td className="px-3 py-3 text-gray-300">
                              {giocatore.fvm ?? "-"}
                            </td>

                          </tr>
                        )
                      )}

                  </tbody>

                </table>

              </div>

            </div>

            {giocatori.length > 100 && (
              <p className="mt-3 text-center text-xs text-gray-500">
                Mostrati i primi 100
                calciatori su{" "}
                {giocatori.length}.
              </p>
            )}

          </div>
        )}

      </div>
    </div>
  );
}