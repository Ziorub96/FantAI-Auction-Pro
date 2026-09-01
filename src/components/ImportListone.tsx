"use client";

import { useState } from "react";
import * as XLSX from "xlsx";

export default function ImportListone() {
  const [fileName, setFileName] = useState<string>("");
  const [players, setPlayers] = useState<any[]>([]);
  const [message, setMessage] = useState<string>("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

    // Salva i dati in localStorage
    localStorage.setItem("listone", JSON.stringify(jsonData));
    setPlayers(jsonData);
    setMessage(`Importati ${jsonData.length} giocatori dal file ${file.name}`);
  };

  return (
    <div className="w-full max-w-md mx-auto mt-10 p-6 bg-gray-900 rounded-lg border border-gray-800">
      <h2 className="text-2xl font-bold text-white mb-4">Importa Listone</h2>
      <label className="block mb-4">
        <span className="text-gray-300">Seleziona file Excel o CSV</span>
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          className="mt-2 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-500"
        />
      </label>
      {fileName && (
        <p className="text-green-400 mb-2">
          File caricato: {fileName}
        </p>
      )}
      {message && (
        <p className="text-green-400 mb-2">{message}</p>
      )}
      {players.length > 0 && (
        <div className="mt-4">
          <p className="text-gray-300 mb-2">Anteprima (primi 5 giocatori):</p>
          <ul className="space-y-1">
            {players.slice(0, 5).map((player, index) => (
              <li key={index} className="text-sm text-gray-400">
                {player["Nome"]} - {player["Ruolo"]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}