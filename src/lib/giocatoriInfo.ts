import { FORMAZIONI } from "@/data/formazioni";
import { INFORTUNI } from "@/data/infortuni";
import { normalizzaNome } from "@/lib/normalizza";

// Non serve più la definizione locale di normalizzaNome

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

export function getTitolarita(
  nomeGiocatore: string,
  squadraGiocatore?: string
): TitolaritaInfo | null {
  const nomeCercato = normalizzaNome(nomeGiocatore);

  for (const squadra of FORMAZIONI) {
    if (squadraGiocatore && normalizzaNome(squadra.squadra) !== normalizzaNome(squadraGiocatore)) {
      continue;
    }

    // Controlla i ballottaggi
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

    // Controlla i titolari certi
    const nomiTitolari = estraiNomiDaFormazione(squadra.formazione).map(normalizzaNome);
    if (nomiTitolari.includes(nomeCercato)) {
      return { percentuale: 100 };
    }
  }

  return null;
}

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