import { FORMAZIONI } from "@/data/formazioni";
import { INFORTUNI } from "@/data/infortuni";

// Normalizza una stringa: minuscola, senza accenti, senza spazi extra
function normalizzaNome(nome: string): string {
  return nome
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// Estrae i nomi dei giocatori da una stringa di formazione
function estraiNomiDaFormazione(formazione: string): string[] {
  return formazione
    .split(/[;,]/) // separa per reparti
    .flatMap((parte) => parte.split("/")) // separa i ballottaggi
    .map((nome) => nome.trim())
    .filter((nome) => nome.length > 0);
}

export interface TitolaritaInfo {
  percentuale: number;
  posizione?: string;
  nota?: string;
}

export interface InfortunioInfo {
  tipo: string;
  fino_ca: string | null;
  nota?: string;
}

/**
 * Cerca la percentuale di titolarità di un giocatore.
 * Se `squadraGiocatore` è fornita, cerca solo in quella squadra.
 */
export function getTitolarita(
  nomeGiocatore: string,
  squadraGiocatore?: string
): TitolaritaInfo | null {
  const nomeCercato = normalizzaNome(nomeGiocatore);

  for (const squadra of FORMAZIONI) {
    // Se è specificata una squadra e non coincide, salta
    if (squadraGiocatore && normalizzaNome(squadra.squadra) !== normalizzaNome(squadraGiocatore)) {
      continue;
    }

    // 1. Controlla i ballottaggi (hanno percentuali esplicite)
    for (const ballottaggio of squadra.ballottaggi) {
      const giocatori = ballottaggio.giocatori.map(normalizzaNome);
      if (giocatori.includes(nomeCercato)) {
        const index = giocatori.indexOf(nomeCercato);
        return {
          percentuale: ballottaggio.percentuali[index] ?? 50,
          posizione: ballottaggio.posizione,
          nota: ballottaggio.nota,
        };
      }
    }

    // 2. Controlla se è un titolare certo (non in ballottaggio)
    const nomiTitolari = estraiNomiDaFormazione(squadra.formazione).map(normalizzaNome);
    if (nomiTitolari.includes(nomeCercato)) {
      return {
        percentuale: 100,
      };
    }
  }

  return null; // Non trovato
}

/**
 * Cerca un giocatore nell'elenco infortunati.
 */
export function getInfortunio(nomeGiocatore: string): InfortunioInfo | null {
  const nomeCercato = normalizzaNome(nomeGiocatore);

  for (const entry of INFORTUNI) {
    if (normalizzaNome(entry.giocatore) === nomeCercato) {
      return {
        tipo: entry.infortunio,
        fino_ca: entry.fino_ca,
        nota: entry.nota,
      };
    }
  }
  return null;
}