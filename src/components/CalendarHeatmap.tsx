"use client";

import { useEffect, useState } from "react";

interface Habit {
  id: string;
  title: string;
  color: string;
}

interface HabitLog {
  id: string;
  date: string;
  completed: boolean;
}

interface CalendarHeatmapProps {
  habits: Habit[];
  onHabitsChange: () => void;
}

export default function CalendarHeatmap({
  habits,
  onHabitsChange,
}: CalendarHeatmapProps) {
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate] = useState(new Date());

  // Generate dates for the current month
  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  
  const dates = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      i + 1
    );
    return date;
  });

  useEffect(() => {
    if (habits.length > 0 && !selectedHabit) {
      setSelectedHabit(habits[0].id);
    }
  }, [habits, selectedHabit]);

  useEffect(() => {
    if (selectedHabit) {
      fetchHabitLogs(selectedHabit);
    }
  }, [selectedHabit]);

  const fetchHabitLogs = async (habitId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/logs/${habitId}`);
      if (response.ok) {
        const data = await response.json();
        setHabitLogs(data);
      }
    } catch (error) {
      console.error("Error fetching habit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleHabitCompletion = async (date: Date) => {
    if (!selectedHabit) return;

    try {
      const dateString = date.toISOString().split("T")[0];
      const existingLog = habitLogs.find(
        (log) => log.date.split("T")[0] === dateString
      );

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId: selectedHabit,
          date: dateString,
          completed: existingLog ? !existingLog.completed : true,
        }),
      });

      if (response.ok) {
        fetchHabitLogs(selectedHabit);
      }
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    }
  };

  const isDateCompleted = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    return habitLogs.some(
      (log) => log.date.split("T")[0] === dateString && log.completed
    );
  };

  const getSelectedHabitColor = () => {
    const habit = habits.find((h) => h.id === selectedHabit);
    return habit?.color || "#4f46e5";
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">
          Add habits to start tracking your progress!
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <label
          htmlFor="habit-select"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Select Habit
        </label>
        <select
          id="habit-select"
          value={selectedHabit || ""}
          onChange={(e) => setSelectedHabit(e.target.value)}
          className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          {habits.map((habit) => (
            <option key={habit.id} value={habit.id}>
              {habit.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading habit data...</p>
        </div>
      ) : (
        <div>
          <div className="mb-2 flex justify-between items-center">
            <h3 className="text-lg font-medium">
              {currentDate.toLocaleString("default", { month: "long" })}{" "}
              {currentDate.getFullYear()}
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="text-xs font-medium text-gray-500 text-center py-1"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells for days before the 1st of the month */}
            {Array.from({
              length: new Date(
                currentDate.getFullYear(),
                currentDate.getMonth(),
                1
              ).getDay(),
            }).map((_, index) => (
              <div key={`empty-${index}`} className="h-10 rounded-md"></div>
            ))}

            {dates.map((date) => {
              const isCompleted = isDateCompleted(date);
              const isToday =
                date.toDateString() === new Date().toDateString();
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => toggleHabitCompletion(date)}
                  disabled={!isPast && !isToday}
                  className={`h-10 rounded-md flex items-center justify-center text-xs font-medium transition-colors ${
                    isCompleted
                      ? "text-white"
                      : isPast || isToday
                      ? "text-gray-700 hover:bg-gray-100"
                      : "text-gray-400 cursor-not-allowed"
                  } ${isToday ? "ring-2 ring-indigo-200" : ""}`}
                  style={{
                    backgroundColor: isCompleted ? getSelectedHabitColor() : "",
                    opacity: isCompleted ? 1 : isPast || isToday ? 1 : 0.5,
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center space-x-2">
            <div className="flex items-center">
              <div className="h-4 w-4 rounded-sm bg-gray-200 mr-1"></div>
              <span className="text-xs text-gray-500">Not completed</span>
            </div>
            <div className="flex items-center">
              <div
                className="h-4 w-4 rounded-sm mr-1"
                style={{ backgroundColor: getSelectedHabitColor() }}
              ></div>
              <span className="text-xs text-gray-500">Completed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}