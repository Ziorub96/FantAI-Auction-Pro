“use client”;

import { useState } from “react”;
import * as XLSX from “xlsx”;

interface Giocatore {
nome: string;
squadra: string;
ruolo: string;
quotazione: number | null;
quotazioneAttuale: number | null;
fvm: number | null;
}

interface ImportListoneProps {
onImport?: (giocatori: Giocatore[]) => void;
}

function normalizzaTesto(valore: unknown): string {
return String(valore ?? “”)
.trim()
.toLowerCase()
.normalize(“NFD”)
.replace(/[\u0300-\u036f]/g, “”)
.replace(/\s+/g, “ “);
}

function trovaColonna(
intestazioni: string[],
alternative: string[]
): number {
const normalizzate = intestazioni.map(normalizzaTesto);

for (const alternativa of alternative) {
const indice = normalizzate.indexOf(normalizzaTesto(alternativa));

if (indice !== -1) {
  return indice;
}

}

for (let i = 0; i < normalizzate.length; i++) {
for (const alternativa of alternative) {
const target = normalizzaTesto(alternativa);

  if (
    target.length >= 3 &&
    (normalizzate[i].includes(target) ||
      target.includes(normalizzate[i]))
  ) {
    return i;
  }
}

}

return -1;
}

function trovaRigaIntestazioni(
righe: unknown[][]
): {
indice: number;
intestazioni: string[];
} | null {
const paroleChiave = [
“calciatore”,
“giocatore”,
“nome”,
“player”,
“sq”,
“squadra”,
“team”,
“qi”,
“qa”,
“fvm”,
“quotazione”,
“ruolo”,
];

let migliore: {
indice: number;
intestazioni: string[];
punteggio: number;
} | null = null;

const limite = Math.min(righe.length, 30);

for (let i = 0; i < limite; i++) {
const riga = righe[i];

if (!Array.isArray(riga)) {
  continue;
}
const intestazioni = riga.map((cella) =>
  String(cella ?? "").trim()
);
let punteggio = 0;
for (const intestazione of intestazioni) {
  const valore = normalizzaTesto(intestazione);
  if (!valore) {
    continue;
  }
  for (const parola of paroleChiave) {
    const target = normalizzaTesto(parola);
    if (
      valore === target ||
      valore.includes(target)
    ) {
      punteggio++;
      break;
    }
  }
}
if (
  !migliore ||
  punteggio > migliore.punteggio
) {
  migliore = {
    indice: i,
    intestazioni,
    punteggio,
  };
}

}

if (!migliore || migliore.punteggio < 1) {
return null;
}

return {
indice: migliore.indice,
intestazioni: migliore.intestazioni,
};
}

function convertiNumero(valore: unknown): number | null {
if (
valore === null ||
valore === undefined ||
valore === “”
) {
return null;
}

if (typeof valore === “number”) {
return Number.isFinite(valore) ? valore : null;
}

const testo = String(valore)
.trim()
.replace(”,”, “.”);

const numero = Number(testo);

return Number.isFinite(numero) ? numero : null;
}

function sembraGiocatore(
nome: string,
squadra: string,
ruolo: string
): boolean {
if (!nome || nome.length < 2) {
return false;
}

const nomeNormalizzato = normalizzaTesto(nome);

const esclusioni = [
“calciatore”,
“giocatore”,
“nome”,
“player”,
“squadra”,
“team”,
“totale”,
“media”,
“quotazione”,
“fvm”,
“fantavalore”,
];

if (esclusioni.includes(nomeNormalizzato)) {
return false;
}

if (squadra || ruolo) {
return true;
}

return /[a-zA-ZÀ-ÿ]/.test(nome);
}

function estraiGiocatoriDaFoglio(
foglio: XLSX.WorkSheet
): Giocatore[] {
const righe = XLSX.utils.sheet_to_json<unknown[]>(
foglio,
{
header: 1,
defval: “”,
raw: true,
}
);

if (!righe.length) {
return [];
}

const informazioni =
trovaRigaIntestazioni(righe);

if (!informazioni) {
return [];
}

const {
indice: rigaIntestazioni,
intestazioni,
} = informazioni;

const indiceNome = trovaColonna(
intestazioni,
[
“Calciatore”,
“Nome”,
“Giocatore”,
“Player”,
]
);

const indiceSquadra = trovaColonna(
intestazioni,
[
“Sq”,
“Squadra”,
“Team”,
“Società”,
“Club”,
]
);

const indiceRuolo = trovaColonna(
intestazioni,
[
“Ruolo”,
“R”,
“Role”,
“Posizione”,
]
);

const indiceQI = trovaColonna(
intestazioni,
[
“QI”,
“Quotazione iniziale”,
“Quotazione”,
“Prezzo iniziale”,
]
);

const indiceQA = trovaColonna(
intestazioni,
[
“QA”,
“Quotazione attuale”,
“Prezzo attuale”,
]
);

const indiceFVM = trovaColonna(
intestazioni,
[
“FVM”,
“Fantavalore”,
“Fantavalore di Mercato”,
]
);

let colonnaNome = indiceNome;

if (colonnaNome === -1) {
let miglioreIndice = -1;
let migliorePunteggio = 0;

for (
  let colonna = 0;
  colonna < intestazioni.length;
  colonna++
) {
  let punteggio = 0;
  for (
    let riga = rigaIntestazioni + 1;
    riga < Math.min(righe.length, rigaIntestazioni + 80);
    riga++
  ) {
    const valore = String(
      righe[riga]?.[colonna] ?? ""
    ).trim();
    if (
      valore.length >= 2 &&
      valore.length <= 60 &&
      /[a-zA-ZÀ-ÿ]/.test(valore)
    ) {
      punteggio++;
    }
  }
  if (punteggio > migliorePunteggio) {
    migliorePunteggio = punteggio;
    miglioreIndice = colonna;
  }
}
colonnaNome = miglioreIndice;

}

if (colonnaNome === -1) {
return [];
}

const giocatori: Giocatore[] = [];

for (
let i = rigaIntestazioni + 1;
i < righe.length;
i++
) {
const riga = righe[i];

if (!Array.isArray(riga)) {
  continue;
}
const nome = String(
  riga[colonnaNome] ?? ""
).trim();
const squadra =
  indiceSquadra !== -1
    ? String(
        riga[indiceSquadra] ?? ""
      ).trim()
    : "";
const ruolo =
  indiceRuolo !== -1
    ? String(
        riga[indiceRuolo] ?? ""
      ).trim()
    : "";
const quotazione =
  indiceQI !== -1
    ? convertiNumero(riga[indiceQI])
    : null;
const quotazioneAttuale =
  indiceQA !== -1
    ? convertiNumero(riga[indiceQA])
    : null;
const fvm =
  indiceFVM !== -1
    ? convertiNumero(riga[indiceFVM])
    : null;
if (
  !sembraGiocatore(
    nome,
    squadra,
    ruolo
  )
) {
  continue;
}
giocatori.push({
  nome,
  squadra,
  ruolo,
  quotazione,
  quotazioneAttuale,
  fvm,
});

}

return giocatori;
}

export default function ImportListone({
onImport,
}: ImportListoneProps) {
const [giocatori, setGiocatori] =
useState<Giocatore[]>([]);

const [nomeFile, setNomeFile] =
useState(””);

const [errore, setErrore] =
useState(””);

const [caricamento, setCaricamento] =
useState(false);

const gestisciFile = async (
evento: React.ChangeEvent
) => {
const file =
evento.target.files?.[0];

if (!file) {
  return;
}
setNomeFile(file.name);
setErrore("");
setGiocatori([]);
setCaricamento(true);
try {
  const buffer =
    await file.arrayBuffer();
  const workbook =
    XLSX.read(buffer, {
      type: "array",
    });
  let miglioriGiocatori: Giocatore[] = [];
  for (
    const nomeFoglio
    of workbook.SheetNames
  ) {
    const foglio =
      workbook.Sheets[nomeFoglio];
    if (!foglio) {
      continue;
    }
    const risultati =
      estraiGiocatoriDaFoglio(
        foglio
      );
    if (
      risultati.length >
      miglioriGiocatori.length
    ) {
      miglioriGiocatori =
        risultati;
    }
  }
  if (
    miglioriGiocatori.length === 0
  ) {
    throw new Error(
      "Non sono riuscito a riconoscere i giocatori nel file."
    );
  }
  setGiocatori(
    miglioriGiocatori
  );
  if (onImport) {
    onImport(
      miglioriGiocatori
    );
  }
} catch (error) {
  console.error(error);
  setErrore(
    error instanceof Error
      ? error.message
      : "Errore durante la lettura del file."
  );
} finally {
  setCaricamento(false);
}

};

return (
    <h2 className="mb-2 text-2xl font-bold text-white">
      Importa Listone
    </h2>
    <p className="mb-6 text-sm text-gray-400">
      Carica il listone Excel o CSV.
      FantAI riconoscerà automaticamente
      le colonne disponibili.
    </p>
    <label className="block cursor-pointer">
      <div className="rounded-xl border-2 border-dashed border-gray-700 bg-gray-800 p-6 text-center active:scale-[0.99]">
        <div className="mb-2 text-3xl">
          📄
        </div>
        <div className="font-semibold text-white">
          {caricamento
            ? "Analisi del file..."
            : "Seleziona file"}
        </div>
        <div className="mt-1 text-xs text-gray-400">
          XLSX, XLS oppure CSV
        </div>
      </div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={gestisciFile}
        className="hidden"
      />
    </label>
    {nomeFile && (
      <div className="mt-4 rounded-lg bg-gray-800 p-3 text-sm text-gray-300">
        File:{" "}
        <span className="font-semibold text-white">
          {nomeFile}
        </span>
      </div>
    )}
    {errore && (
      <div className="mt-4 rounded-xl border border-red-800 bg-red-950/40 p-4">
        <p className="font-semibold text-red-400">
          Errore importazione
        </p>
        <p className="mt-1 text-sm text-red-300">
          {errore}
        </p>
      </div>
    )}
    {giocatori.length > 0 && (
      <div className="mt-6">
        <div className="mb-4 rounded-xl border border-green-800 bg-green-950/30 p-4">
          <p className="font-bold text-green-400">
            Importazione completata
          </p>
          <p className="mt-1 text-sm text-green-300">
            Trovati{" "}
            <strong>
              {giocatori.length}
            </strong>{" "}
            giocatori.
          </p>
        </div>
        <div className="overflow-hidden rounded-xl border border-gray-800">
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-gray-800 text-gray-300">
                <tr>
                  <th className="px-3 py-3">
                    Giocatore
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
                        key={`${giocatore.nome}-${indice}`}
                        className="border-t border-gray-800"
                      >
                        <td className="px-3 py-3 font-medium text-white">
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
            Visualizzati i primi 100
            giocatori su{" "}
            {giocatori.length}.
          </p>
        )}
      </div>
    )}
  </div>
</div>

);
}