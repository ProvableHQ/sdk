import { useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProvableKit } from "@provablehq/provablekit";
import { createReactNativeEngine } from "@provablehq/provable-engine-react-native";

type KeyBundle = {
  address: string;
  privateKey: string;
  viewKey: string;
};

let bootPromise: Promise<unknown> | null = null;

function callToString(value: any): string {
  if (value?.toString) return value.toString();
  if (value?.to_string) return value.to_string();
  return String(value ?? "");
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.stack ?? `${error.name}: ${error.message}`;
  }
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

async function ensureBoot() {
  if (!bootPromise) {
    bootPromise = ProvableKit.init({
      engine: createReactNativeEngine(),
      env: { network: "testnet" },
    });
  }
  return (await bootPromise) as any;
}

export default function App() {
  const [bundle, setBundle] = useState<KeyBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const capabilities = await ensureBoot();
      const account = capabilities?.highLevel?.createAccount?.();
      if (!account) {
        throw new Error("React Native engine does not expose highLevel.createAccount");
      }
      const privateKey = account.privateKey?.();
      const viewKey = account.viewKey?.() ?? privateKey?.to_view_key?.();
      const address = account.address?.();
      setBundle({
        address: callToString(address),
        privateKey: callToString(privateKey),
        viewKey: callToString(viewKey),
      });
    } catch (e: any) {
      setError(formatError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>ProvableKit Expo (React Native) Keygen</Text>
        <Button title={loading ? "Generating..." : "Generate Address / Keys"} onPress={generate} disabled={loading} />

        {error ? <Text style={styles.error}>Error: {error}</Text> : null}

        {bundle ? (
          <View style={styles.card}>
            <Text style={styles.label}>Address</Text>
            <Text selectable style={styles.value}>{bundle.address}</Text>
            <Text style={styles.label}>Private Key</Text>
            <Text selectable style={styles.value}>{bundle.privateKey}</Text>
            <Text style={styles.label}>View Key</Text>
            <Text selectable style={styles.value}>{bundle.viewKey}</Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20, gap: 12 },
  title: { fontSize: 22, fontWeight: "700" },
  card: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: "#ddd", borderRadius: 10, gap: 6 },
  label: { fontWeight: "700" },
  value: { fontFamily: "Courier", fontSize: 12 },
  error: { color: "#b00020", marginTop: 10 },
});
