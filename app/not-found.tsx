export default function NotFoundPage() {
  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <pre>{JSON.stringify({ success: false, code: "NOT_FOUND", message: "Halaman tidak ditemukan" }, null, 2)}</pre>
    </main>
  );
}