export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-green-500 mb-4">
        FantAI Auction Pro
      </h1>
      <p className="text-center text-gray-300 mb-8">
        Il tuo assistente d’asta intelligente per il Fantacalcio.
      </p>
      <button className="rounded-lg bg-orange-600 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:bg-orange-500 transition">
        Nuova Lega
      </button>
      <p className="mt-6 text-sm text-gray-500">
        Configura la tua lega per iniziare.
      </p>
    </main>
  );
}