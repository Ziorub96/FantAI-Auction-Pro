"use client";

import { useState, useEffect } from "react";
import ImportListone from "@/components/ImportListone";

interface LegaConfig {
  partecipanti: number;
  budget: number;
  modalita: "classic" | "mantra";
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
  ordineAsta: "random" | "libera" | "manuale";
}

interface Player {
  nome: string;
  ruolo?: string;
  squadra?: string;
  quotazioneIniziale?: number;
  quotazioneAttuale?: number;
  fvm?: number;
  prezzoPagato?: number;
  [key: string]: unknown;
}

interface Squadra {
  nome: string;
  budget: number;
  giocatori: Player[];
}

interface Acquisto {
  giocatore: string;
  squadra: string;
  prezzo: number;
  timestamp: string;
}

const configIniziale: LegaConfig = {
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
  const [view, setView] = useState<"wizard" | "import" | "dashboard" | "asta">("wizard");
  const [passo, setPasso] = useState(1);
  const [config, setConfig] = useState<LegaConfig>(configIniziale);
  const [giocatori, setGiocatori] = useState<Player[]>([]);
  const [squadre, setSquadre] = useState<Squadra[]>([]);
  const [acquisti, setAcquisti] = useState<Acquisto[]>([]);
  const [ricerca, setRicerca] = useState("");
  const [giocatoreSelezionato, setGiocatoreSelezionato] = useState<Player | null>(null);
  const [prezzo, setPrezzo] = useState("");
  const [squadraAcquirente, setSquadraAcquirente] = useState("");
  const [messaggio, setMessaggio] = useState("");

  // Inizializza squadre quando si entra in asta
  useEffect(() => {
    if (view === "asta") {
      const squadreSalvate = localStorage.getItem("fantai-squadre");
      if (squadreSalvate) {
        setSquadre(JSON.parse(squadreSalvate));
      } else {
        const iniziali: Squadra[] = Array.from({ length: config.partecipanti }, (_, i) => ({
          nome: `Squadra ${i + 1}`,
          budget: config.budget,
          giocatori: [],
        }));
        setSquadre(iniziali);
        setSquadraAcquirente(iniziali[0]?.nome || "");
      }
      const giocatoriSalvati = localStorage.getItem("fantai-giocatori");
      if (giocatoriSalvati) {
        setGiocatori(JSON.parse(giocatoriSalvati));
      }
      const acquistiSalvati = localStorage.getItem("fantai-acquisti");
      if (acquistiSalvati) {
        setAcquisti(JSON.parse(acquistiSalvati));
      }
    }
  }, [view, config]);

  const vaiAvanti = () => setPasso((p) => Math.min(p + 1, 7));
  const vaiIndietro = () => setPasso((p) => Math.max(p - 1, 1));

  const aggiornaConfig = (modifiche: Partial<LegaConfig>) => {
    setConfig((prev) => ({ ...prev, ...modifiche }));
  };

  const salvaConfigurazione = () => {
    localStorage.setItem("fantai-legaconfig", JSON.stringify(config));
    setView("import");
  };

  const handleImportComplete = (players: Player[]) => {
    setGiocatori(players);
    localStorage.setItem("fantai-giocatori", JSON.stringify(players));
    setView("dashboard");
  };

  // ---------- FUNZIONI PER L'ASTA ----------

  const giocatoriDisponibili = giocatori.filter(
    (g) => !squadre.some((s) => s.giocatori.some((sg) => sg.nome === g.nome))
  );

  const giocatoriFiltrati = giocatoriDisponibili.filter((g) =>
    g.nome.toLowerCase().includes(ricerca.toLowerCase())
  );

  const calcolaPrezzoConsigliato = (player: Player): number => {
    // Base: FVM se disponibile, altrimenti quotazione
    const base = player.fvm || player.quotazioneIniziale || 10;

    // Budget totale lega
    const budgetTotale = config.budget * config.partecipanti;

    // Inflazione: media prezzi pagati / media valori base
    let inflazione = 1;
    if (acquisti.length > 0) {
      const mediaPagata = acquisti.reduce((sum, a) => sum + a.prezzo, 0) / acquisti.length;
      const mediaBase = acquisti.reduce((sum, a) => {
        const giocatore = giocatori.find((g) => g.nome === a.giocatore);
        return sum + (giocatore?.fvm || giocatore?.quotazioneIniziale || 10);
      }, 0) / acquisti.length;
      if (mediaBase > 0) {
        inflazione = mediaPagata / mediaBase;
        inflazione = Math.max(0.8, Math.min(inflazione, 1.5)); // limitiamo
      }
    }

    // Domanda di ruolo
    const ruolo = player.ruolo || "";
    const fabbisognoRuolo = config.rosa[ruolo as keyof typeof config.rosa] || 5;
    const giocatoriRuoloAcquistati = squadre.reduce(
      (sum, s) => sum + s.giocatori.filter((g) => g.ruolo === ruolo).length,
      0
    );
    const totaleNecessario = config.partecipanti * fabbisognoRuolo;
    const domanda = Math.max(1, totaleNecessario - giocatoriRuoloAcquistati);
    const fattoreDomanda = 1 + domanda / totaleNecessario;

    // Budget residuo medio
    const budgetResiduoMedio = squadre.length > 0
      ? squadre.reduce((sum, s) => sum + s.budget, 0) / squadre.length
      : config.budget;
    const fattoreBudget = budgetResiduoMedio / config.budget;

    const prezzoBase = base * (budgetTotale / 1000);
    const prezzoConsigliato = Math.round(prezzoBase * inflazione * fattoreDomanda * fattoreBudget);

    return Math.max(1, prezzoConsigliato);
  };

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

    const nuoveSquadre = [...squadre];
    nuoveSquadre[squadraIndex] = {
      ...nuoveSquadre[squadraIndex],
      budget: nuoveSquadre[squadraIndex].budget - prezzoNum,
      giocatori: [...nuoveSquadre[squadraIndex].giocatori, { ...giocatoreSelezionato, prezzoPagato: prezzoNum }],
    };
    setSquadre(nuoveSquadre);

    const nuovoAcquisto: Acquisto = {
      giocatore: giocatoreSelezionato.nome,
      squadra: squadraAcquirente,
      prezzo: prezzoNum,
      timestamp: new Date().toISOString(),
    };
    const nuoviAcquisti = [...acquisti, nuovoAcquisto];
    setAcquisti(nuoviAcquisti);

    // Persistenza
    localStorage.setItem("fantai-squadre", JSON.stringify(nuoveSquadre));
    localStorage.setItem("fantai-acquisti", JSON.stringify(nuoviAcquisti));

    setGiocatoreSelezionato(null);
    setPrezzo("");
    setMessaggio(`Acquisto registrato: ${giocatoreSelezionato.nome} → ${squadraAcquirente} per ${prezzoNum} crediti.`);
  };

  const resetAsta = () => {
    const conferma = window.confirm("Vuoi azzerare tutta l'asta?");
    if (!conferma) return;
    const iniziali: Squadra[] = Array.from({ length: config.partecipanti }, (_, i) => ({
      nome: `Squadra ${i + 1}`,
      budget: config.budget,
      giocatori: [],
    }));
    setSquadre(iniziali);
    setAcquisti([]);
    setGiocatoreSelezionato(null);
    setPrezzo("");
    setMessaggio("");
    localStorage.removeItem("fantai-squadre");
    localStorage.removeItem("fantai-acquisti");
  };

  // ---------- RENDER ----------

  if (view === "asta") {
    const prezzoConsigliato = giocatoreSelezionato ? calcolaPrezzoConsigliato(giocatoreSelezionato) : 0;
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <button onClick={() => setView("dashboard")} className="mb-6 text-gray-400 underline">
            ← Torna alla Dashboard
          </button>

          {/* Riepilogo squadre */}
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 mb-6">
            <h2 className="text-xl font-bold text-white mb-3">Squadre e Budget</h2>
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
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 mb-6">
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
              {giocatoriFiltrati.length === 0 && <p className="text-gray-500 text-sm">Nessun giocatore trovato.</p>}
            </div>
          </div>

          {/* Dettaglio giocatore e registrazione */}
          {giocatoreSelezionato && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5 mb-6">
              <h2 className="text-xl font-bold text-white mb-2">{giocatoreSelezionato.nome}</h2>
              <p className="text-sm text-gray-400 mb-4">
                {giocatoreSelezionato.ruolo} • {giocatoreSelezionato.squadra} • Quotazione: {giocatoreSelezionato.quotazioneIniziale}
              </p>

              {/* Suggerimenti algoritmo */}
              <div className="mb-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-green-950 p-3 text-center">
                  <p className="text-xs text-green-400">Consigliato</p>
                  <p className="text-xl font-bold">{prezzoConsigliato}</p>
                </div>
                <div className="rounded-xl bg-orange-950 p-3 text-center">
                  <p className="text-xs text-orange-400">Aggressivo</p>
                  <p className="text-xl font-bold">{Math.round(prezzoConsigliato * 1.1)}</p>
                </div>
                <div className="rounded-xl bg-red-950 p-3 text-center">
                  <p className="text-xs text-red-400">Massimo</p>
                  <p className="text-xl font-bold">{Math.round(prezzoConsigliato * 1.2)}</p>
                </div>
              </div>

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

          {/* Messaggio */}
          {messaggio && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-4">
              <p className="text-sm text-gray-300">{messaggio}</p>
            </div>
          )}

          {/* Cronologia acquisti */}
          {acquisti.length > 0 && (
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-5">
              <h3 className="text-lg font-bold text-white mb-3">Ultimi acquisti</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {acquisti.slice(-10).reverse().map((a, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{a.giocatore}</span>
                    <span>{a.squadra} - {a.prezzo} cr</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Reset */}
          <button
            onClick={resetAsta}
            className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-800 px-6 py-3 font-semibold text-white"
          >
            Azzera asta
          </button>
        </div>
      </main>
    );
  }

  // ---------- DASHBOARD ----------
  if (view === "dashboard") {
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
            <h2 className="text-2xl font-bold text-green-400">Dashboard</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-300">
              <p><span className="font-semibold">Partecipanti:</span> {config.partecipanti}</p>
              <p><span className="font-semibold">Budget:</span> {config.budget} crediti</p>
              <p><span className="font-semibold">Modalità:</span> {config.modalita === "classic" ? "Classic" : "Mantra"}</p>
              <p><span className="font-semibold">Giocatori importati:</span> {giocatori.length}</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl border border-gray-800 bg-gray-900 p-5">
            <h3 className="text-lg font-bold mb-3">Primi 20 giocatori</h3>
            <ul className="space-y-2 max-h-96 overflow-y-auto">
              {giocatori.slice(0, 20).map((g, i) => (
                <li key={i} className="flex justify-between text-sm text-gray-300">
                  <span>{g.nome}</span>
                  <span>{g.squadra || "-"}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            onClick={() => setView("asta")}
            className="mt-6 w-full rounded-xl bg-orange-600 px-6 py-4 font-bold text-white"
          >
            Modalità Asta
          </button>
          <button
            onClick={() => {
              localStorage.removeItem("fantai-legaconfig");
              localStorage.removeItem("fantai-giocatori");
              localStorage.removeItem("fantai-squadre");
              localStorage.removeItem("fantai-acquisti");
              window.location.reload();
            }}
            className="mt-3 w-full rounded-xl bg-gray-700 px-6 py-3 font-semibold text-white"
          >
            Reimposta tutto
          </button>
        </div>
      </main>
    );
  }

  // ---------- IMPORT ----------
  if (view === "import") {
    return (
      <main className="min-h-screen bg-black text-white px-5 py-8">
        <div className="mx-auto w-full max-w-md">
          <ImportListone onComplete={handleImportComplete} />
          <button
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

  // ---------- WIZARD ----------
  return (
    <main className="min-h-screen bg-black text-white px-5 py-8">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold tracking-widest text-orange-500">FANTAI AUCTION PRO</p>
          <h1 className="mt-2 text-3xl font-bold">Configura la tua lega</h1>
          <p className="mt-2 text-sm text-gray-400">Passo {passo} di 7</p>
        </div>
        <div className="mb-8 h-2 rounded-full bg-gray-800">
          <div className="h-2 rounded-full bg-orange-600 transition-all" style={{ width: `${(passo / 7) * 100}%` }} />
        </div>

        {passo === 1 && (
          <section className="text-center">
            <div className="rounded-2xl border border-gray-800 bg-gray-900 p-6">
              <div className="mb-5 text-5xl">⚽</div>
              <h2 className="text-2xl font-bold">Benvenuto in FantAI</h2>
              <p className="mt-4 text-gray-400">Configura la tua lega per preparare FantAI all'asta.</p>
              <button onClick={vaiAvanti} className="mt-8 w-full rounded-xl bg-orange-600 px-6 py-4 text-lg font-bold active:scale-95">
                Nuova Lega
              </button>
            </div>
          </section>
        )}

        {passo === 2 && (
          <section>
            <h2 className="text-2xl font-bold">Numero partecipanti</h2>
            <p className="mt-2 text-gray-400">Quante squadre partecipano?</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[6, 8, 10, 12].map((numero) => (
                <button
                  key={numero}
                  onClick={() => aggiornaConfig({ partecipanti: numero })}
                  className={`rounded-xl border p-5 text-xl font-bold ${
                    config.partecipanti === numero ? "border-green-500 bg-green-600" : "border-gray-700 bg-gray-900"
                  }`}
                >
                  {numero}
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 3 && (
          <section>
            <h2 className="text-2xl font-bold">Budget iniziale</h2>
            <p className="mt-2 text-gray-400">Quanti crediti avrà ogni squadra?</p>
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={config.budget}
              onChange={(e) => aggiornaConfig({ budget: Number(e.target.value) })}
              className="mt-6 w-full rounded-xl border border-gray-700 bg-gray-900 p-4 text-2xl font-bold text-white"
            />
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 4 && (
          <section>
            <h2 className="text-2xl font-bold">Modalità</h2>
            <p className="mt-2 text-gray-400">Scegli la modalità della lega.</p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => aggiornaConfig({ modalita: "classic" })}
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "classic" ? "border-green-500 bg-green-600" : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">Classic</p>
              </button>
              <button
                onClick={() => aggiornaConfig({ modalita: "mantra" })}
                className={`w-full rounded-xl border p-5 text-left ${
                  config.modalita === "mantra" ? "border-green-500 bg-green-600" : "border-gray-700 bg-gray-900"
                }`}
              >
                <p className="font-bold">Mantra</p>
              </button>
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 5 && (
          <section>
            <h2 className="text-2xl font-bold">Composizione rosa</h2>
            <p className="mt-2 text-gray-400">Imposta i giocatori per ruolo.</p>
            <div className="mt-6 space-y-3">
              {(
                [
                  ["portieri", "Portieri"],
                  ["difensori", "Difensori"],
                  ["centrocampisti", "Centrocampisti"],
                  ["attaccanti", "Attaccanti"],
                ] as const
              ).map(([chiave, nome]) => (
                <div key={chiave} className="flex items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4">
                  <span className="text-gray-300">{nome}</span>
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={config.rosa[chiave]}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        rosa: { ...prev.rosa, [chiave]: Number(e.target.value) },
                      }))
                    }
                    className="w-20 rounded-lg border border-gray-700 bg-gray-800 p-2 text-center font-bold"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 6 && (
          <section>
            <h2 className="text-2xl font-bold">Regole</h2>
            <p className="mt-2 text-gray-400">Seleziona le regole della lega.</p>
            <div className="mt-6 space-y-3">
              {(
                [
                  ["modificatoreDifesa", "Modificatore difesa"],
                  ["imbattibilita", "Imbattibilità"],
                  ["portaInviolata", "Porta inviolata"],
                  ["assist", "Assist"],
                  ["rigori", "Rigori"],
                ] as const
              ).map(([chiave, nome]) => {
                const attiva = config.regole[chiave];
                return (
                  <button
                    key={chiave}
                    onClick={() =>
                      setConfig((prev) => ({
                        ...prev,
                        regole: { ...prev.regole, [chiave]: !attiva },
                      }))
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-gray-800 bg-gray-900 p-4"
                  >
                    <span className="text-gray-300">{nome}</span>
                    <span className={`h-7 w-12 rounded-full p-1 ${attiva ? "bg-green-600" : "bg-gray-700"}`}>
                      <span className={`block h-5 w-5 rounded-full bg-white transition-transform ${attiva ? "translate-x-5" : ""}`} />
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={vaiAvanti} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Avanti</button>
            </div>
          </section>
        )}

        {passo === 7 && (
          <section>
            <h2 className="text-2xl font-bold">Ordine asta</h2>
            <p className="mt-2 text-gray-400">Scegli come gestire l'ordine.</p>
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
                  onClick={() => aggiornaConfig({ ordineAsta: valore as LegaConfig["ordineAsta"] })}
                  className={`w-full rounded-xl border p-5 text-left ${
                    config.ordineAsta === valore ? "border-green-500 bg-green-600" : "border-gray-700 bg-gray-900"
                  }`}
                >
                  <p className="font-bold">{nome}</p>
                </button>
              ))}
            </div>
            <div className="mt-8 flex justify-between">
              <button onClick={vaiIndietro} className="text-gray-400 underline">Indietro</button>
              <button onClick={salvaConfigurazione} className="rounded-xl bg-orange-600 px-7 py-3 font-bold">Completa</button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}