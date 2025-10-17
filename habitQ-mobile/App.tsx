import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Platform } from "react-native";
import { api } from "./src/api/client";
import { Heatmap } from "./src/components/Heatmap";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [session, setSession] = useState<any | null>(null);
  const [habits, setHabits] = useState<any[]>([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Try get existing session on load
    (async () => {
      const s = await api.getSession();
      if (s?.user) {
        setSession(s);
        await loadHabits();
      }
    })();
  }, []);

  const selectedHabit = useMemo(() => habits.find(h => h.id === selectedHabitId) || null, [habits, selectedHabitId]);

  async function loadHabits() {
    setLoading(true);
    try {
      const hs = await api.getHabits();
      setHabits(hs);
      if (hs.length) {
        setSelectedHabitId(hs[0].id);
        await loadLogs(hs[0].id);
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load habits");
    } finally {
      setLoading(false);
    }
  }

  async function loadLogs(habitId: string) {
    setLoading(true);
    try {
      const ls = await api.getHabitLogs(habitId);
      setLogs(ls);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  async function onLogin() {
    setLoading(true);
    const res = await api.login(email.trim(), password);
    setLoading(false);
    if (!res.ok) {
      Alert.alert("Login failed", res.error || "");
      return;
    }
    const s = await api.getSession();
    if (!s?.user) {
      Alert.alert("Login", "Logged in, but no session returned.");
      return;
    }
    setSession(s);
    await loadHabits();
  }

  async function toggle(date: Date) {
    if (!selectedHabit) return;
    // Optimistic update: compute count from current logs
    const ds = date.toISOString().split("T")[0];
    const forDate = logs.filter((l) => l.completed && l.date.split("T")[0] === ds);
    const isDone = forDate.length > 0;
    const optimistic = [...logs];
    if (isDone) {
      // Remove all for date
      const filtered = optimistic.filter((l) => l.date.split("T")[0] !== ds);
      setLogs(filtered);
      const ok = await api.toggleHabit(selectedHabit.id, ds, false);
      if (!ok) {
        // revert on failure
        setLogs(optimistic);
        Alert.alert("Update failed", "Could not update habit.");
      } else {
        // Revalidate quietly
        loadLogs(selectedHabit.id);
      }
    } else {
      // Add one completed log
      const newLog = { id: Math.random().toString(), date: new Date(date.getTime() + Math.floor(Math.random() * 86400000)).toISOString(), completed: true };
      setLogs([...optimistic, newLog]);
      const ok = await api.toggleHabit(selectedHabit.id, ds, true);
      if (!ok) {
        setLogs(optimistic);
        Alert.alert("Update failed", "Could not update habit.");
      } else {
        loadLogs(selectedHabit.id);
      }
    }
  }

  if (!session?.user) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>HabitQ Mobile</Text>
          <Text style={styles.subtitle}>Login to view your map</Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholder="Email"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="Password"
            style={styles.input}
          />
          <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? "Signing in..." : "Sign In"}</Text>
          </TouchableOpacity>
          <Text style={styles.note}>API: {api.baseUrl} ({Platform.OS})</Text>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Your Habits</Text>
        {loading && <ActivityIndicator style={{ marginBottom: 8 }} />}
        <View style={styles.habitRow}>
          {habits.map((h) => (
            <TouchableOpacity key={h.id} onPress={() => { setSelectedHabitId(h.id); loadLogs(h.id); }} style={[styles.habitChip, selectedHabitId === h.id ? styles.habitChipActive : null]}>
              <View style={[styles.colorDot, { backgroundColor: h.color }]} />
              <Text style={styles.habitText}>{h.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Heatmap habit={selectedHabit} logs={logs} onToggle={toggle} />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  input: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12 },
  button: { backgroundColor: "#4f46e5", borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
  note: { marginTop: 8, fontSize: 12, color: "#6b7280" },
  habitRow: { flexDirection: "row", flexWrap: "wrap", marginBottom: 8 },
  habitChip: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 16, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6, marginBottom: 6 },
  habitChipActive: { borderColor: "#4f46e5" },
  colorDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  habitText: { fontSize: 12 },
});
