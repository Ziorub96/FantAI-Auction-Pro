"use client";

import { useState, useEffect } from "react";

interface Player {
  nome: string;
  ruolo?: string;
  squadra?: string;
  quotazioneIniziale?: number;
  quotazioneAttuale?: number;
  fvm?: number;
  [key: string]: unknown;
}

interface Squadra {
  nome: string;
  budget: number;
  giocatori: Player[];
}

interface AstaProps {
  giocatori: Player[];
  config: {
    partecipanti: number;
    budget: number;
    modalita: string;
    rosa: {
      portieri: number;
      difensori: number;
      centrocampisti: number;
      attaccanti: number;
    };
  };
}

export default function Asta({ giocatori, config }: AstaProps) {
  const [squadre, setSquadre] = useState<Squadra[]>([]);
  const [giocatoriDisponibili, setGiocatoriDisponibili] = useState<Player[]>(giocatori);
  const [ricerca, setRicerca] = useState("");
  const [giocatoreSelezionato, setGiocatoreSelezionato] = useState<Player | null>(null);
  const [prezzo, setPrezzo] = useState<string>("");
  const [squadraAcquirente, setSquadraAcquirente] = useState<string>("");
  const [messaggio, setMessaggio] = useState("");

  // Inizializza le squadre
  useEffect(() => {
    const iniziali: Squadra[] = Array.from({ length: config.partecipanti }, (_, i) => ({
      nome: `Squadra ${i + 1}`,
      budget: config.budget,
      giocatori: [],
    }));
    setSquadre(iniziali);
    setSquadraAcquirente(iniziali[0]?.nome || "");
  }, [config]);

  const giocatoriFiltrati = giocatoriDisponibili.filter((g) =>
    g.nome.toLowerCase().includes(ricerca.toLowerCase())
  );

  const registraAcquisto = () => {
    if (!giocatoreSelezionato || !prezzo || !squadraAcquirente) {
      setMessaggio("Seleziona giocatore, inserisci prezzo e scegli squadra.");
      return;
    }

    const prezzoNum = Number(prezzo);
    if (isNaN(prezzoNum) || prezzoNum <= 0) {
      setMessaggio("Prezzo non valido.");
      return;
    }

    const squadraIndex = squadre.findIndex((s) => s.nome === squadraAcquirente);
    if (squadraIndex === -1) {
      setMessaggio("Squadra non trovata.");
      return;
    }

    if (squadre[squadraIndex].budget < prezzoNum) {
      setMessaggio(`Budget insufficiente per ${squadre[squadraIndex].nome}.`);
      return;
    }

    // Aggiorna squadre
    const nuoveSquadre = [...squadre];
    nuoveSquadre[squadraIndex] = {
      ...nuoveSquadre[squadraIndex],
      budget: nuoveSquadre[squadraIndex].budget - prezzoNum,
      giocatori: [...nuoveSquadre[squadraIndex].giocatori, { ...giocatoreSelezionato, prezzoPagato: prezzoNum }],
    };
    setSquadre(nuoveSquadre);

    // Rimuovi giocatore dai disponibili
    setGiocatoriDisponibili((prev) => prev.filter((g) => g.nome !== giocatoreSelezionato.nome));
    setGiocatoreSelezionato(null);
    setPrezzo("");
    setMessaggio(`Acquisto registrato: ${giocatoreSelezionato.nome} → ${squadraAcquirente} per ${prezzoNum} crediti.`);
  };

  return (
    <div className="space-y-6">
      {/* Riepilogo squadre */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-xl font-bold text-white mb-4">Squadre e Budget</h2>
        <div className="space-y-2">
          {squadre.map((s) => (
            <div key={s.nome} className="flex items-center justify-between text-sm">
              <span className="font-semibold text-white">{s.nome}</span>
              <span className="text-gray-300">Budget: {s.budget}</span>
              <span className="text-gray-500">Giocatori: {s.giocatori.length}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Ricerca giocatore */}
      <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
        <h2 className="text-xl font-bold text-white mb-3">Cerca giocatore</h2>
        <input
          type="text"
          placeholder="Nome giocatore..."
          value={ricerca}
          onChange={(e) => setRicerca(e.target.value)}
          className="w-full rounded-xl border border-gray-700 bg-gray-800 p-3 text-white"
        />
        <div className="mt-3 max-h-60 overflow-y-auto">
          {giocatoriFiltrati.slice(0, 30).map((g, i) => (
            <button
              key={`${g.nome}-${i}`}
              onClick={() => setGiocatoreSelezionato(g)}
              className={`w-full text-left px-4 py-2 rounded-lg mb-1 ${
                giocatoreSelezionato?.nome === g.nome
                  ? "bg-green-600 text-white"
                  : "bg-gray-800 text-gray-300 hover:bg-gray-700"
              }`}
            >
              {g.nome} {g.squadra && `(${g.squadra})`}
            </button>
          ))}
          {giocatoriFiltrati.length === 0 && (
            <p className="text-gray-500 text-sm">Nessun giocatore trovato.</p>
          )}
        </div>
      </div>

      {/* Dettaglio giocatore selezionato e registrazione acquisto */}
      {giocatoreSelezionato && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
          <h2 className="text-xl font-bold text-white mb-2">{giocatoreSelezionato.nome}</h2>
          <p className="text-sm text-gray-400 mb-4">
            {giocatoreSelezionato.ruolo} • {giocatoreSelezionato.squadra} • Quotazione: {giocatoreSelezionato.quotazioneIniziale}
          </p>
          <div className="space-y-3">
            <input
              type="number"
              placeholder="Prezzo pagato"
              value={prezzo}
              onChange={(e) => setPrezzo(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 p-3 text-white"
            />
            <select
              value={squadraAcquirente}
              onChange={(e) => setSquadraAcquirente(e.target.value)}
              className="w-full rounded-xl border border-gray-700 bg-gray-800 p-3 text-white"
            >
              {squadre.map((s) => (
                <option key={s.nome} value={s.nome}>
                  {s.nome} (Budget: {s.budget})
                </option>
              ))}
            </select>
            <button
              onClick={registraAcquisto}
              className="w-full rounded-xl bg-orange-600 px-6 py-4 font-bold text-white"
            >
              Registra Acquisto
            </button>
          </div>
        </div>
      )}

      {messaggio && (
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
          <p className="text-sm text-gray-300">{messaggio}</p>
        </div>
      )}
    </div>
  );
}