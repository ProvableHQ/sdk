import { useState } from "react";
import { Button, SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { ProvableKit } from "@provablehq/provablekit";
import { createReactNativeEngine } from "@provablehq/provable-engine-react-native";
import { Account } from "@provablehq/shield-mobile-sdk";

type KeyBundle = {
  address: string;
  privateKey: string;
  viewKey: string;
};

let bootPromise: Promise<unknown> | null = null;

async function ensureBoot() {
  if (!bootPromise) {
    bootPromise = ProvableKit.init({
      engine: createReactNativeEngine(),
      env: { network: "testnet" },
    });
  }
  await bootPromise;
}

export default function App() {
  const [bundle, setBundle] = useState<KeyBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      await ensureBoot();
      const account = new Account();
      setBundle({
        address: account.address().toString(),
        privateKey: account.privateKey().toString(),
        viewKey: account.viewKey().toString(),
      });
    } catch (e: any) {
      setError(e?.message ?? String(e));
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
