/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Consumer ID (used for both DPS and RSS)
  readonly VITE_ALEO_CONSUMER_ID?: string;

  // Proving mode
  readonly VITE_ALEO_PROVING_MODE?: "local" | "delegated";

  // DPS (Delegated Proving Service)
  readonly VITE_ALEO_DPS_URL?: string;
  readonly VITE_ALEO_DPS_API_KEY?: string;
  readonly VITE_ALEO_DPS_PRIVACY?: string;

  // RSS scanner
  readonly VITE_ALEO_RSS_URL?: string;
  readonly VITE_ALEO_RSS_API_KEY?: string;
  readonly VITE_ALEO_SCAN_START_HEIGHT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
