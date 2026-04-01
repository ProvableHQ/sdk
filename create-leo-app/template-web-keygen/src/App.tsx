import { useState } from "react";
import { AleoWorker } from "./workers/AleoWorker";
import "./App.css";

type KeyBundle = {
  address: string;
  privateKey: string;
  viewKey: string;
};

const aleoWorker = AleoWorker();

export default function App() {
  const [bundle, setBundle] = useState<KeyBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await aleoWorker.generateKeys();
      setBundle(next);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="container">
      <h1>ProvableKit Web (WASM) Keygen</h1>
      <button onClick={onGenerate} disabled={loading}>
        {loading ? "Generating..." : "Generate Address / Keys"}
      </button>

      {error ? <p className="error">Error: {error}</p> : null}

      {bundle ? (
        <section className="card">
          <p><strong>Address</strong></p>
          <pre>{bundle.address}</pre>
          <p><strong>Private Key</strong></p>
          <pre>{bundle.privateKey}</pre>
          <p><strong>View Key</strong></p>
          <pre>{bundle.viewKey}</pre>
        </section>
      ) : null}
    </main>
  );
}
