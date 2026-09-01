"use client";
import { useState } from "react";
import * as XLSX from "xlsx";

interface Player {
  nome: string;
  ruolo?: string;
  squadra?: string;
  quotazioneIniziale?: number;
  quotazioneAttuale?: number;
  fvm?: number;
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

function convertiNumero(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  const testo = String(value)
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const numero = Number(testo);
  return Number.isFinite(numero) ? numero : undefined;
}

function trovaIndiceColonna(
  header: string[],
  nomiAccettati: string[]
): number {
  const normalizzati = header.map(normalizzaTesto);
  for (const nome of nomiAccettati) {
    const target = normalizzaTesto(nome);
    const indice = normalizzati.indexOf(target);
    if (indice !== -1) {
      return indice;
    }
  }
  // fallback parziale
  for (let i = 0; i < normalizzati.length; i++) {
    for (const nome of nomiAccettati) {
      const target = normalizzaTesto(nome);
      if (
        target.length >= 2 &&
        normalizzati[i].includes(target)
      ) {
        return i;
      }
    }
  }
  return -1;
}

function trovaRigaIntestazioni(rows: unknown[][]): number {
  // Scorriamo le prime 10 righe
  const limite = Math.min(rows.length, 10);
  for (let r = 0; r < limite; r++) {
    const row = rows[r];
    if (!row || row.length === 0) {
      continue;
    }
    const header = row.map((c) => String(c ?? "").trim());
    const haNome = header.some(
      (h) => normalizzaTesto(h) === "nome"
    );
    const haSquadra = header.some(
      (h) => normalizzaTesto(h) === "squadra"
    );
    const haQuotazione = header.some((h) => {
      const n = normalizzaTesto(h);
      return n === "qt.i" || n === "qt.a" || n === "quotazione iniziale" || n === "quotazione attuale";
    });
    const haFVM = header.some((h) => normalizzaTesto(h) === "fvm");
    // Richiediamo almeno Nome + (Squadra o Quotazione o FVM)
    if (haNome && (haSquadra || haQuotazione || haFVM)) {
      return r;
    }
  }
  // fallback: cerca una riga che contenga "nome" in modo parziale
  for (let r = 0; r < limite; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;
    const header = row.map((c) => String(c ?? "").trim().toLowerCase());
    if (header.some((h) => h.includes("nome"))) {
      return r;
    }
  }
  return 0;
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
        throw new Error("Il file Excel non contiene nessun foglio.");
      }
      // Priorità al foglio "Tutti", altrimenti il primo
      let nomeFoglio = workbook.SheetNames.find(
        (nome) => normalizzaTesto(nome) === "tutti"
      );
      if (!nomeFoglio) {
        nomeFoglio = workbook.SheetNames[0];
      }
      const worksheet = workbook.Sheets[nomeFoglio];
      if (!worksheet) {
        throw new Error("Non riesco ad aprire il foglio del listone.");
      }
      const rows = XLSX.utils.sheet_to_json<unknown[]>(
        worksheet,
        {
          header: 1,
          defval: "",
          raw: false,
        }
      );
      if (!rows.length) {
        throw new Error("Il foglio selezionato è vuoto.");
      }
      const indiceHeader = trovaRigaIntestazioni(rows);
      const header = rows[indiceHeader]?.map((c) => String(c ?? "").trim()) ?? [];

      // Individua colonne specifiche
      const indiceNome = trovaIndiceColonna(header, ["Nome"]);
      const indiceSquadra = trovaIndiceColonna(header, ["Squadra"]);
      // Ruolo: preferiamo "R" (classico) e "RM" (mantra)
      const indiceRuoloClassic = trovaIndiceColonna(header, ["R"]);
      const indiceRuoloMantra = trovaIndiceColonna(header, ["RM"]);
      // Quotazioni
      const indiceQtI = trovaIndiceColonna(header, ["Qt.I", "Quotazione iniziale"]);
      const indiceQtA = trovaIndiceColonna(header, ["Qt.A", "Quotazione attuale"]);
      const indiceFVM = trovaIndiceColonna(header, ["FVM"]);

      if (indiceNome === -1) {
        // Fallback: mostra le intestazioni trovate per debug
        const intestazioniVisibili = header.join(" | ");
        throw new Error(
          `Non ho trovato la colonna "Nome". ` +
          `Riga intestazioni individuata: ${indiceHeader + 1}. ` +
          `Colonne trovate: ${intestazioniVisibili || "nessuna"}`
        );
      }

      const risultato: Player[] = [];
      for (let r = indiceHeader + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) {
          continue;
        }
        const nome = valoreCella(row, indiceNome);
        if (!nome) continue;

        // Scarta righe che sembrano intestazioni ripetute
        const nomeNormalizzato = normalizzaChiave(nome);
        if (
          nomeNormalizzato === "nome" ||
          nomeNormalizzato === "calciatore" ||
          nomeNormalizzato === "giocatore"
        ) {
          continue;
        }

        const player: Player = { nome };
        if (indiceSquadra !== -1) {
          const squadra = valoreCella(row, indiceSquadra);
          if (squadra) player.squadra = squadra;
        }
        // Ruolo: se presente R, lo usiamo; altrimenti RM
        let ruolo: string | undefined;
        if (indiceRuoloClassic !== -1) {
          ruolo = valoreCella(row, indiceRuoloClassic);
        }
        if (!ruolo && indiceRuoloMantra !== -1) {
          ruolo = valoreCella(row, indiceRuoloMantra);
        }
        if (ruolo) player.ruolo = ruolo;

        if (indiceQtI !== -1) {
          const val = convertiNumero(row[indiceQtI]);
          if (val !== undefined) player.quotazioneIniziale = val;
        }
        if (indiceQtA !== -1) {
          const val = convertiNumero(row[indiceQtA]);
          if (val !== undefined) player.quotazioneAttuale = val;
        }
        if (indiceFVM !== -1) {
          const val = convertiNumero(row[indiceFVM]);
          if (val !== undefined) player.fvm = val;
        }

        // Salva anche le colonne originali per utilizzo futuro
        for (let c = 0; c < header.length; c++) {
          const nomeColonna = header[c] ?? "";
          if (!nomeColonna) continue;
          const chiave = normalizzaChiave(nomeColonna);
          if (!chiave) continue;
          player[chiave] = row[c] ?? "";
        }
        risultato.push(player);
      }

      if (!risultato.length) {
        throw new Error("Ho trovato la struttura ma non ho estratto giocatori.");
      }

      setPlayers(risultato);
      setInfo(
        `Importati ${risultato.length} giocatori dal foglio "${nomeFoglio}". ` +
        `Intestazioni alla riga ${indiceHeader + 1}.`
      );
      if (onImport) {
        onImport(risultato);
      }
    } catch (error) {
      console.error(error);
      setErrore(
        error instanceof Error
          ? error.message
          : "Errore durante l'importazione del file."
      );
    } finally {
      setLoading(false);
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
          {loading ? "Analisi del file..." : "Seleziona file Excel / CSV"}
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
            File: <span className="font-semibold text-white">{nomeFile}</span>
          </p>
        )}
      </div>

      {errore && (
        <div className="rounded-2xl border border-red-800 bg-red-950/40 p-5">
          <h3 className="mb-2 font-bold text-red-400">Errore</h3>
          <p className="text-sm leading-6 text-red-200">{errore}</p>
        </div>
      )}

      {info && !errore && (
        <div className="rounded-2xl border border-green-800 bg-green-950/30 p-5">
          <h3 className="mb-2 font-bold text-green-400">Importazione completata</h3>
          <p className="text-sm leading-6 text-green-200">{info}</p>
        </div>
      )}

      {players.length > 0 && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Anteprima giocatori</h3>
            <span className="rounded-full bg-green-600/20 px-3 py-1 text-xs font-bold text-green-400">
              {players.length}
            </span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-3 py-3">Giocatore</th>
                  <th className="px-3 py-3">Sq</th>
                  <th className="px-3 py-3">Ruolo</th>
                  <th className="px-3 py-3">Qt.I</th>
                  <th className="px-3 py-3">FVM</th>
                </tr>
              </thead>
              <tbody>
                {players.slice(0, 100).map((player, index) => (
                  <tr key={`${player.nome}-${index}`} className="border-t border-gray-800">
                    <td className="px-3 py-3 font-medium text-white">{player.nome}</td>
                    <td className="px-3 py-3 text-gray-300">{player.squadra || "-"}</td>
                    <td className="px-3 py-3 text-gray-300">{player.ruolo || "-"}</td>
                    <td className="px-3 py-3 text-gray-300">
                      {player.quotazioneIniziale ?? "-"}
                    </td>
                    <td className="px-3 py-3 text-gray-300">{player.fvm ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {players.length > 100 && (
            <p className="mt-3 text-center text-xs text-gray-500">
              Visualizzati i primi 100 giocatori su {players.length}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}