// app/page.tsx
export default function Home() {
  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontFamily: "monospace",
        gap: "0.5rem",
      }}
    >
      <h1>🟢 API is running</h1>
      <p>Service: my-project-backend</p>
      <p>Version: v1.0.0</p>
      <p>
        Health check:{" "}
        <a href="/api/health" style={{ color: "#0070f3" }}>
          /api/health
        </a>
      </p>
    </main>
  );
}