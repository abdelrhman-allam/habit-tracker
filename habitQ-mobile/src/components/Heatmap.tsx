import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export type Habit = { id: string; title: string; color: string };
export type HabitLog = { id: string; date: string; completed: boolean; count?: number };

function getMonthDates(date: Date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const days = last.getDate();
  const arr: Date[] = [];
  for (let i = 1; i <= days; i++) {
    arr.push(new Date(date.getFullYear(), date.getMonth(), i));
  }
  return { dates: arr, startDay: first.getDay() };
}

function getIntensityColor(hex: string, count: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const intensity = count === 1 ? 0.7 : count === 2 ? 0.85 : 1;
  return `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * intensity)})`;
}

type HeatmapProps = {
  habit: Habit | null;
  logs: HabitLog[];
  onToggle: (date: Date) => void;
};

export const Heatmap: React.FC<HeatmapProps> = ({ habit, logs, onToggle }) => {
  const current = new Date();
  const { dates, startDay } = getMonthDates(current);

  const isCompleted = (d: Date) => {
    const ds = d.toISOString().split("T")[0];
    const forDate = logs.filter((l) => l.completed && l.date.split("T")[0] === ds);
    return { done: forDate.length > 0, count: forDate.length };
  };

  return (
    <View style={{ paddingHorizontal: 8 }}>
      <Text style={styles.header}>{current.toLocaleString("default", { month: "long" })} {current.getFullYear()}</Text>
      <View style={styles.daysRow}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <Text key={d} style={styles.dayLabel}>{d}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {Array.from({ length: startDay }).map((_, i) => (
          <View key={`empty-${i}`} style={styles.cell} />
        ))}
        {dates.map((d) => {
          const { done, count } = isCompleted(d);
          const bg = habit && done ? getIntensityColor(habit.color, count) : "transparent";
          const now = new Date();
          const isPastOrToday = d < new Date(now.setHours(0,0,0,0)) || d.toDateString() === new Date().toDateString();
          return (
            <TouchableOpacity
              key={d.toISOString()}
              style={[styles.cell, done ? { backgroundColor: bg } : styles.cellInactive]}
              disabled={!isPastOrToday}
              onPress={() => onToggle(d)}
            >
              <Text style={[styles.cellText, done ? { color: "#fff" } : {}]}>{d.getDate()}</Text>
              {done && count > 1 && (
                <View style={styles.badge}><Text style={styles.badgeText}>{count}</Text></View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { fontSize: 18, fontWeight: "600", marginBottom: 8 },
  daysRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  dayLabel: { fontSize: 12, color: "#6b7280", width: 36, textAlign: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: { width: 36, height: 36, borderRadius: 6, margin: 2, alignItems: "center", justifyContent: "center", backgroundColor: "#f9fafb" },
  cellInactive: { backgroundColor: "#f9fafb" },
  cellText: { fontSize: 12, color: "#374151" },
  badge: { position: "absolute", bottom: 2, right: 2, backgroundColor: "#fff", borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 9, color: "#111827", fontWeight: "700" },
});