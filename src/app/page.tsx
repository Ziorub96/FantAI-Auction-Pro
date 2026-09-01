"use client";

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "black",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "32px", marginBottom: "20px" }}>
          TEST DEFINITIVO
        </h1>

        <button
          type="button"
          onClick={() => alert("CLICK FUNZIONANTE")}
          style={{
            background: "orange",
            color: "black",
            border: "0",
            borderRadius: "12px",
            padding: "20px 40px",
            fontSize: "20px",
            fontWeight: "bold",
          }}
        >
          CLICCA QUI
        </button>
      </div>
    </main>
  );
}