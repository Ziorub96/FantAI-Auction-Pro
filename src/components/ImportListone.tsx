"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

interface Player {
  nome: string;
  ruolo?: string;
  squadra?: string;
  quotazione?: number;
  [key: string]: unknown;
}

interface ImportListoneProps {
  onImport?: (players: Player[]) => void;
}

function normalizzaTesto(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

function normalizzaChiave(value: unknown): string {
  return normalizzaTesto(value)
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, "");
}

function valoreCella(row: unknown[], index: number): string {
  if (index < 0 || index >= row.length) {
    return "";
  }

  return String(row[index] ?? "").trim();
}

/**
 * Cerca la riga che contiene le vere intestazioni.
 *
 * Il listone può avere:
 * riga 1 = titolo / informazioni
 * riga 2 = intestazioni
 * riga 3+ = giocatori
 *
 * Per questo controlliamo diverse righe invece di assumere
 * che l'intestazione sia sempre la prima.
 */
function trovaRigaIntestazioni(rows: unknown[][]): number {
  const paroleNome = [
    "calciatore",
    "calciatori",
    "giocatore",
    "giocatori",
    "nome",
    "nome giocatore",
    "nome calciatore",
    "cognome",
    "player",
    "players",
    "footballer",
  ];

  const paroleRuolo = [
    "ruolo",
    "ruoli",
    "role",
    "posizione",
    "position",
  ];

  const paroleSquadra = [
    "squadra",
    "club",
    "team",
    "societa",
    "societa sportiva",
  ];

  let migliorIndice = 0;
  let migliorPunteggio = -1;

  const righeDaControllare = Math.min(rows.length, 15);

  for (let r = 0; r < righeDaControllare; r++) {
    const row = rows[r];

    if (!row || row.length === 0) {
      continue;
    }

    let punteggio = 0;

    for (const cell of row) {
      const valore = normalizzaTesto(cell);

      if (!valore) {
        continue;
      }

      if (paroleNome.includes(valore)) {
        punteggio += 10;
      }

      if (paroleRuolo.includes(valore)) {
        punteggio += 4;
      }

      if (paroleSquadra.includes(valore)) {
        punteggio += 3;
      }

      if (
        valore.includes("calciator") ||
        valore.includes("giocator") ||
        valore.includes("player")
      ) {
        punteggio += 8;
      }

      if (
        valore.includes("ruolo") ||
        valore.includes("position")
      ) {
        punteggio += 3;
      }

      if (
        valore.includes("squadra") ||
        valore.includes("team") ||
        valore.includes("club")
      ) {
        punteggio += 2;
      }
    }

    if (punteggio > migliorPunteggio) {
      migliorPunteggio = punteggio;
      migliorIndice = r;
    }
  }

  return migliorPunteggio > 0 ? migliorIndice : 0;
}

/**
 * Trova la colonna del nome.
 *
 * Non ci affidiamo a un solo nome preciso.
 */
function trovaColonnaNome(header: unknown[]): number {
  const esatti = [
    "calciatore",
    "giocatore",
    "nome",
    "nome giocatore",
    "nome calciatore",
    "cognome",
    "player",
    "footballer",
    "calciatori",
    "giocatori",
  ];

  const normalizzati = header.map((h) => normalizzaTesto(h));

  // 1. Ricerca esatta
  for (const candidato of esatti) {
    const index = normalizzati.findIndex(
      (h) => h === candidato
    );

    if (index !== -1) {
      return index;
    }
  }

  // 2. Ricerca parziale
  for (let i = 0; i < normalizzati.length; i++) {
    const h = normalizzati[i];

    if (
      h.includes("calciator") ||
      h.includes("giocator") ||
      h.includes("player") ||
      h.includes("footballer")
    ) {
      return i;
    }
  }

  // 3. Cerca colonne contenenti "nome"
  for (let i = 0; i < normalizzati.length; i++) {
    const h = normalizzati[i];

    if (h === "nome" || h.startsWith("nome ")) {
      return i;
    }
  }

  // 4. Cerca "cognome"
  for (let i = 0; i < normalizzati.length; i++) {
    if (normalizzati[i].includes("cognome")) {
      return i;
    }
  }

  return -1;
}

function trovaColonna(
  header: unknown[],
  parole: string[]
): number {
  const normalizzati = header.map((h) => normalizzaTesto(h));

  for (const parola of parole) {
    const indice = normalizzati.findIndex(
      (h) => h === normalizzaTesto(parola)
    );

    if (indice !== -1) {
      return indice;
    }
  }

  for (let i = 0; i < normalizzati.length; i++) {
    for (const parola of parole) {
      if (
        normalizzati[i].includes(normalizzaTesto(parola))
      ) {
        return i;
      }
    }
  }

  return -1;
}

/**
 * Alcuni listoni hanno una colonna "Nome" e una "Cognome".
 * Se esistono entrambe, le concateniamo.
 */
function trovaColonneNomeECognome(header: unknown[]) {
  const normalizzati = header.map((h) => normalizzaTesto(h));

  let nome = -1;
  let cognome = -1;

  for (let i = 0; i < normalizzati.length; i++) {
    const h = normalizzati[i];

    if (
      nome === -1 &&
      (h === "nome" ||
        h === "nome giocatore" ||
        h === "nome calciatore")
    ) {
      nome = i;
    }

    if (
      cognome === -1 &&
      h === "cognome"
    ) {
      cognome = i;
    }
  }

  return { nome, cognome };
}

function convertiNumero(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "number") {
    return value;
  }

  const testo = String(value)
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");

  const numero = Number(testo);

  return Number.isFinite(numero) ? numero : undefined;
}

export default function ImportListone({
  onImport,
}: ImportListoneProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [nomeFile, setNomeFile] = useState("");
  const [info, setInfo] = useState("");

  const analizzaFile = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setLoading(true);
    setErrore("");
    setInfo("");
    setPlayers([]);
    setNomeFile(file.name);

    try {
      const buffer = await file.arrayBuffer();

      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });

      if (!workbook.SheetNames.length) {
        throw new Error(
          "Il file Excel non contiene nessun foglio."
        );
      }

      /*
       * PRIORITÀ:
       * 1. foglio "Tutti"
       * 2. primo foglio disponibile
       */
      let nomeFoglio = workbook.SheetNames.find(
        (nome) =>
          normalizzaTesto(nome) === "tutti"
      );

      if (!nomeFoglio) {
        nomeFoglio = workbook.SheetNames[0];
      }

      const worksheet = workbook.Sheets[nomeFoglio];

      if (!worksheet) {
        throw new Error(
          "Non riesco ad aprire il foglio del listone."
        );
      }

      /*
       * header: 1
       * ci permette di leggere tutte le righe come array.
       *
       * È fondamentale perché le intestazioni del listone
       * possono iniziare dalla seconda riga.
       */
      const rows = XLSX.utils.sheet_to_json<unknown[]>(
        worksheet,
        {
          header: 1,
          defval: "",
          raw: false,
        }
      );

      if (!rows.length) {
        throw new Error(
          "Il foglio selezionato è vuoto."
        );
      }

      const indiceHeader =
        trovaRigaIntestazioni(rows);

      const header = rows[indiceHeader] ?? [];

      /*
       * Prima proviamo il caso standard:
       * una singola colonna Calciatore/Giocatore/Nome.
       */
      let indiceNome =
        trovaColonnaNome(header);

      /*
       * Poi controlliamo il caso:
       * Nome + Cognome separati.
       */
      const colonneNomeCognome =
        trovaColonneNomeECognome(header);

      /*
       * Se abbiamo Nome + Cognome ma non abbiamo
       * una colonna Calciatore, useremo quelle due.
       */
      const usaNomeECognome =
        indiceNome === -1 &&
        colonneNomeCognome.nome !== -1 &&
        colonneNomeCognome.cognome !== -1;

      if (indiceNome === -1 && !usaNomeECognome) {
        /*
         * FALLBACK INTELLIGENTE
         *
         * Cerchiamo tra le colonne quella che contiene
         * prevalentemente valori testuali simili a nomi.
         */
        let migliore = -1;
        let migliorPunteggio = 0;

        const numeroRighe =
          Math.min(rows.length, indiceHeader + 101);

        for (
          let colonna = 0;
          colonna < header.length;
          colonna++
        ) {
          let punteggio = 0;

          for (
            let r = indiceHeader + 1;
            r < numeroRighe;
            r++
          ) {
            const valore =
              valoreCella(rows[r], colonna);

            if (!valore) {
              continue;
            }

            /*
             * Un nome normalmente:
             * - è testo
             * - non è un numero puro
             * - non è troppo lungo
             */
            if (
              valore.length >= 2 &&
              valore.length <= 60 &&
              !/^\d+$/.test(valore)
            ) {
              punteggio++;
            }
          }

          if (punteggio > migliorPunteggio) {
            migliorPunteggio = punteggio;
            migliore = colonna;
          }
        }

        if (
          migliore !== -1 &&
          migliorPunteggio >= 2
        ) {
          indiceNome = migliore;
        }
      }

      if (indiceNome === -1 && !usaNomeECognome) {
        const intestazioniVisibili =
          header
            .map((h) => String(h ?? "").trim())
            .filter(Boolean)
            .join(" | ");

        throw new Error(
          `Non riesco a individuare la colonna del nome del giocatore. ` +
          `Riga intestazioni individuata: ${indiceHeader + 1}. ` +
          `Colonne trovate: ${intestazioniVisibili || "nessuna"}`
        );
      }

      /*
       * Individuazione delle altre colonne.
       */
      const indiceRuolo = trovaColonna(
        header,
        [
          "ruolo",
          "ruoli",
          "posizione",
          "position",
          "role",
        ]
      );

      const indiceSquadra = trovaColonna(
        header,
        [
          "squadra",
          "club",
          "team",
          "società",
          "societa",
        ]
      );

      const indiceQuotazione = trovaColonna(
        header,
        [
          "quotazione",
          "quotazione iniziale",
          "quotazione fantacalcio",
          "prezzo",
          "valore",
          "quot",
          "qt",
        ]
      );

      const risultato: Player[] = [];

      for (
        let r = indiceHeader + 1;
        r < rows.length;
        r++
      ) {
        const row = rows[r];

        if (!row || row.length === 0) {
          continue;
        }

        let nome = "";

        if (usaNomeECognome) {
          const nomeParte = valoreCella(
            row,
            colonneNomeCognome.nome
          );

          const cognomeParte = valoreCella(
            row,
            colonneNomeCognome.cognome
          );

          nome =
            `${nomeParte} ${cognomeParte}`.trim();
        } else {
          nome = valoreCella(row, indiceNome);
        }

        /*
         * Scartiamo:
         * - righe completamente vuote
         * - righe che sembrano intestazioni ripetute
         */
        if (!nome) {
          continue;
        }

        const nomeNormalizzato =
          normalizzaChiave(nome);

        if (
          nomeNormalizzato === "calciatore" ||
          nomeNormalizzato === "giocatore" ||
          nomeNormalizzato === "nome" ||
          nomeNormalizzato === "player"
        ) {
          continue;
        }

        const player: Player = {
          nome,
        };

        if (indiceRuolo !== -1) {
          const ruolo = valoreCella(
            row,
            indiceRuolo
          );

          if (ruolo) {
            player.ruolo = ruolo;
          }
        }

        if (indiceSquadra !== -1) {
          const squadra = valoreCella(
            row,
            indiceSquadra
          );

          if (squadra) {
            player.squadra = squadra;
          }
        }

        if (indiceQuotazione !== -1) {
          const quotazione = convertiNumero(
            valoreCella(row, indiceQuotazione)
          );

          if (quotazione !== undefined) {
            player.quotazione = quotazione;
          }
        }

        /*
         * Salviamo anche tutte le colonne originali.
         * Questo sarà molto utile più avanti per
         * l'algoritmo FantAlgoritmo.
         */
        for (
          let c = 0;
          c < header.length;
          c++
        ) {
          const nomeColonna =
            String(header[c] ?? "").trim();

          if (!nomeColonna) {
            continue;
          }

          const chiave =
            normalizzaChiave(nomeColonna);

          if (!chiave) {
            continue;
          }

          player[chiave] =
            row[c] ?? "";
        }

        risultato.push(player);
      }

      if (!risultato.length) {
        throw new Error(
          "Ho trovato la struttura del foglio, ma non ho trovato nessun giocatore."
        );
      }

      setPlayers(risultato);

      setInfo(
        `Importati ${risultato.length} giocatori ` +
        `dal foglio "${nomeFoglio}". ` +
        `Intestazioni alla riga ${indiceHeader + 1}.`
      );

      if (onImport) {
        onImport(risultato);
      }
    } catch (error) {
      console.error(error);

      const messaggio =
        error instanceof Error
          ? error.message
          : "Errore durante l'importazione del file.";

      setErrore(messaggio);
    } finally {
      setLoading(false);

      /*
       * Permette di selezionare nuovamente lo stesso file
       * anche dopo un errore.
       */
      event.target.value = "";
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-2 text-2xl font-bold text-white">
          Importa listone
        </h2>

        <p className="mb-6 text-sm leading-6 text-gray-400">
          Carica il file Excel o CSV del listone.
          FantAI analizzerà automaticamente la struttura
          del foglio e individuerà i giocatori.
        </p>

        <label
          htmlFor="file-listone"
          className="block w-full cursor-pointer rounded-xl bg-orange-600 px-6 py-4 text-center font-semibold text-white transition active:scale-95 hover:bg-orange-500"
        >
          {loading
            ? "Analisi del file..."
            : "Seleziona file Excel / CSV"}
        </label>

        <input
          id="file-listone"
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={analizzaFile}
          disabled={loading}
          className="hidden"
        />

        {nomeFile && (
          <p className="mt-4 text-center text-sm text-gray-400">
            File:{" "}
            <span className="font-semibold text-white">
              {nomeFile}
            </span>
          </p>
        )}
      </div>

      {errore && (
        <div className="rounded-2xl border border-red-800 bg-red-950/40 p-5">
          <h3 className="mb-2 font-bold text-red-400">
            Errore
          </h3>

          <p className="text-sm leading-6 text-red-200">
            {errore}
          </p>
        </div>
      )}

      {info && !errore && (
        <div className="rounded-2xl border border-green-800 bg-green-950/30 p-5">
          <h3 className="mb-2 font-bold text-green-400">
            Importazione completata
          </h3>

          <p className="text-sm leading-6 text-green-200">
            {info}
          </p>
        </div>
      )}

      {players.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">
              Anteprima giocatori
            </h3>

            <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-bold text-green-400">
              {players.length}
            </span>
          </div>

          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {players
                .slice(0, 50)
                .map((player, index) => (
                  <div
                    key={`${player.nome}-${index}`}
                    className="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3"
                  >
                    <div>
                      <p className="font-semibold text-white">
                        {player.nome}
                      </p>

                      {(player.ruolo ||
                        player.squadra) && (
                        <p className="text-xs text-gray-400">
                          {player.ruolo ?? ""}
                          {player.ruolo &&
                          player.squadra
                            ? " • "
                            : ""}
                          {player.squadra ?? ""}
                        </p>
                      )}
                    </div>

                    {player.quotazione !==
                      undefined && (
                      <span className="text-sm font-bold text-orange-400">
                        {player.quotazione}
                      </span>
                    )}
                  </div>
                ))}
            </div>
          </div>

          {players.length > 50 && (
            <p className="mt-4 text-center text-xs text-gray-500">
              Mostrati i primi 50 giocatori su{" "}
              {players.length}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}