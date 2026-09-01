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
  onComplete?: (players: Player[]) => void;
}

function pulisci(value: unknown): string {
  return String(value ?? "").trim();
}

function normalizza(value: unknown): string {
  return pulisci(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function convertiNumero(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  const testo = String(value).replace(",", ".").replace(/[^\d.-]/g, "");
  const numero = Number(testo);
  return Number.isFinite(numero) ? numero : undefined;
}

function trovaColonna(header: string[], candidati: string[]): number {
  const norm = header.map(normalizza);
  for (const c of candidati) {
    const idx = norm.indexOf(normalizza(c));
    if (idx !== -1) return idx;
  }
  return -1;
}

function trovaRigaIntestazioni(rows: unknown[][]): number {
  const limite = Math.min(rows.length, 10);
  for (let r = 0; r < limite; r++) {
    const row = rows[r];
    if (!row) continue;
    for (const cell of row) {
      if (normalizza(cell) === "nome") return r;
    }
  }
  return -1;
}

export default function ImportListone({ onComplete }: ImportListoneProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [errore, setErrore] = useState("");
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [nomeFile, setNomeFile] = useState("");
  const [info, setInfo] = useState("");

  const analizzaFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setErrore("");
    setInfo("");
    setDebugInfo("");
    setPlayers([]);
    setNomeFile(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      if (!workbook.SheetNames.length) {
        throw new Error("Il file Excel non contiene nessun foglio.");
      }

      let nomeFoglio = workbook.SheetNames.find((n) => normalizza(n) === "tutti");
      if (!nomeFoglio) nomeFoglio = workbook.SheetNames[0];

      const worksheet = workbook.Sheets[nomeFoglio];
      if (!worksheet) throw new Error("Non riesco ad aprire il foglio del listone.");

      const rows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
        header: 1,
        defval: "",
        raw: false,
      });

      if (!rows.length) throw new Error("Il foglio selezionato e' vuoto.");

      const indiceHeader = trovaRigaIntestazioni(rows);

      if (indiceHeader === -1) {
        const anteprima = rows
          .slice(0, 5)
          .map((r, i) => `Riga ${i + 1}: ${JSON.stringify(r)}`)
          .join("\n");
        throw new Error(
          `Non ho trovato nessuna cella "Nome" nelle prime 10 righe del foglio "${nomeFoglio}".\n\nAnteprima:\n${anteprima}`
        );
      }

      const header = (rows[indiceHeader] ?? []).map((c) => pulisci(c));

      const indiceNome = trovaColonna(header, ["Nome"]);
      const indiceSquadra = trovaColonna(header, ["Squadra"]);
      const indiceRuoloClassic = trovaColonna(header, ["R"]);
      const indiceRuoloMantra = trovaColonna(header, ["RM"]);
      const indiceQtI = trovaColonna(header, ["Qt.I"]);
      const indiceQtA = trovaColonna(header, ["Qt.A"]);
      const indiceFVM = trovaColonna(header, ["FVM"]);

      setDebugInfo(
        `Foglio: ${nomeFoglio} | Riga intestazioni: ${indiceHeader + 1} | ` +
        `Header letto: ${JSON.stringify(header)} | ` +
        `Indice Nome: ${indiceNome}, Squadra: ${indiceSquadra}, R: ${indiceRuoloClassic}, RM: ${indiceRuoloMantra}, Qt.I: ${indiceQtI}, Qt.A: ${indiceQtA}, FVM: ${indiceFVM}`
      );

      if (indiceNome === -1) {
        throw new Error(
          `Riga intestazioni trovata (riga ${indiceHeader + 1}) ma nessuna colonna corrisponde a "Nome" nella ricerca per indice. Header letto: ${JSON.stringify(header)}`
        );
      }

      const risultato: Player[] = [];
      for (let r = indiceHeader + 1; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length === 0) continue;
        const nome = pulisci(row[indiceNome]);
        if (!nome) continue;

        const player: Player = { nome };
        if (indiceSquadra !== -1) player.squadra = pulisci(row[indiceSquadra]) || undefined;

        let ruolo: string | undefined;
        if (indiceRuoloClassic !== -1) ruolo = pulisci(row[indiceRuoloClassic]) || undefined;
        if (!ruolo && indiceRuoloMantra !== -1) ruolo = pulisci(row[indiceRuoloMantra]) || undefined;
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
        risultato.push(player);
      }

      if (!risultato.length) {
        throw new Error("Struttura trovata ma nessun giocatore estratto. Controlla il debug qui sopra.");
      }

      setPlayers(risultato);
      setInfo(`Importati ${risultato.length} giocatori dal foglio "${nomeFoglio}".`);
    } catch (error) {
      console.error(error);
      setErrore(error instanceof Error ? error.message : "Errore durante l'importazione del file.");
    } finally {
      setLoading(false);
      event.target.value = "";
    }
  };

  const vaiAllaDashboard = () => {
    if (onComplete && players.length > 0) {
      onComplete(players);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
        <h2 className="mb-2 text-2xl font-bold text-white">Importa listone</h2>
        <p className="mb-6 text-sm leading-6 text-gray-400">
          Carica il file Excel o CSV del listone.
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
          <p className="whitespace-pre-wrap text-sm leading-6 text-red-200">{errore}</p>
        </div>
      )}

      {debugInfo && (
        <div className="rounded-2xl border border-yellow-800 bg-yellow-950/20 p-5">
          <h3 className="mb-2 font-bold text-yellow-400">Debug</h3>
          <p className="whitespace-pre-wrap break-words text-xs leading-5 text-yellow-100">{debugInfo}</p>
        </div>
      )}

      {info && !errore && (
        <div className="rounded-2xl border border-green-800 bg-green-950/30 p-5">
          <h3 className="mb-2 font-bold text-green-400">Importazione completata</h3>
          <p className="text-sm leading-6 text-green-200">{info}</p>
        </div>
      )}

      {players.length > 0 && (
        <>
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
                      <td className="px-3 py-3 text-gray-300">{player.quotazioneIniziale ?? "-"}</td>
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

          <button
            onClick={vaiAllaDashboard}
            className="w-full rounded-xl bg-green-600 px-6 py-4 text-center font-bold text-white transition active:scale-95 hover:bg-green-500"
          >
            Vai alla Dashboard
          </button>
        </>
      )}
    </div>
  );
}