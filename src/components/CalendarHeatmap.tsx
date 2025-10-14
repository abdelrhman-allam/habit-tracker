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
  count?: number;
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
  const [allHabitLogs, setAllHabitLogs] = useState<Record<string, HabitLog[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [currentDate] = useState(new Date());
  const [showAllHabits, setShowAllHabits] = useState(false);

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

  useEffect(() => {
    if (habits.length > 0) {
      fetchAllHabitLogs();
    }
  }, [habits]);

  const fetchAllHabitLogs = async () => {
    setIsLoading(true);
    try {
      const logsMap: Record<string, HabitLog[]> = {};
      
      for (const habit of habits) {
        const response = await fetch(`/api/logs/${habit.id}`);
        if (response.ok) {
          const data = await response.json();
          logsMap[habit.id] = data;
        }
      }
      
      setAllHabitLogs(logsMap);
    } catch (error) {
      console.error("Error fetching all habit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
      const { isCompleted } = getDateCompletionInfo(date);

      const response = await fetch("/api/logs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          habitId: selectedHabit,
          date: dateString,
          completed: !isCompleted, // If already completed, we'll delete all logs for this date
        }),
      });

      if (response.ok) {
        fetchHabitLogs(selectedHabit);
        fetchAllHabitLogs(); // Refresh all habit logs
      }
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    }
  };

  const getDateCompletionInfo = (date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const logsForDate = habitLogs.filter(
      (log) => log.date.split("T")[0] === dateString && log.completed
    );
    return {
      isCompleted: logsForDate.length > 0,
      count: logsForDate.length
    };
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
      <div className="mb-6 flex flex-wrap gap-4 items-center">
        <div>
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
            disabled={showAllHabits}
          >
            {habits.map((habit) => (
              <option key={habit.id} value={habit.id}>
                {habit.title}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center">
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={showAllHabits} 
              onChange={() => setShowAllHabits(!showAllHabits)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-700">Show All Habits</span>
          </label>
        </div>
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
              const dateString = date.toISOString().split("T")[0];
              const isToday = date.toDateString() === new Date().toDateString();
              const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
              
              if (showAllHabits) {
                // Show all habits in a GitHub-style grid
                return (
                  <div
                    key={date.toISOString()}
                    className={`h-10 rounded-md relative flex flex-wrap gap-0.5 p-0.5 ${
                      isPast || isToday
                        ? "bg-gray-50"
                        : "bg-gray-50 opacity-50"
                    } ${isToday ? "ring-2 ring-indigo-200" : ""}`}
                  >
                    <div className="absolute top-0 left-0 text-[8px] text-gray-500 p-0.5">
                      {date.getDate()}
                    </div>
                    
                    {habits.map((habit) => {
                      const habitLogs = allHabitLogs[habit.id] || [];
                      const logsForDate = habitLogs.filter(
                        (log) => log.date.split("T")[0] === dateString && log.completed
                      );
                      const count = logsForDate.length;
                      const isCompleted = count > 0;
                      
                      if (!isCompleted) return null;
                      
                      // Get the RGB values from the hex color
                      const r = parseInt(habit.color.slice(1, 3), 16);
                      const g = parseInt(habit.color.slice(3, 5), 16);
                      const b = parseInt(habit.color.slice(5, 7), 16);
                      
                      // Calculate intensity based on count
                      const intensity = count === 1 ? 0.7 : count === 2 ? 0.85 : 1;
                      const backgroundColor = `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * intensity)})`;
                      
                      return (
                        <div
                          key={`${date.toISOString()}-${habit.id}`}
                          className="w-3 h-3 rounded-sm flex items-center justify-center"
                          style={{ backgroundColor }}
                          title={`${habit.title}: ${count} completion(s)`}
                        >
                          {count > 1 && (
                            <span className="text-[6px] text-white font-bold">
                              {count}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              } else {
                // Show only selected habit
                const { isCompleted, count } = getDateCompletionInfo(date);
                
                // Calculate color intensity based on count
                const baseColor = getSelectedHabitColor();
                let backgroundColor = "";
                
                if (isCompleted) {
                  // Get the RGB values from the hex color
                  const r = parseInt(baseColor.slice(1, 3), 16);
                  const g = parseInt(baseColor.slice(3, 5), 16);
                  const b = parseInt(baseColor.slice(5, 7), 16);
                  
                  // Calculate intensity - more habits means more saturated color
                  // For count = 1, use 70% intensity, for count = 2, use 85%, for count >= 3, use 100%
                  const intensity = count === 1 ? 0.7 : count === 2 ? 0.85 : 1;
                  
                  // Apply intensity to the color
                  backgroundColor = `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * intensity)})`;
                }

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => toggleHabitCompletion(date)}
                    disabled={!isPast && !isToday}
                    className={`h-10 rounded-md flex items-center justify-center text-xs font-medium transition-colors relative ${
                      isCompleted
                        ? "text-white"
                        : isPast || isToday
                        ? "text-gray-700 hover:bg-gray-100"
                        : "text-gray-400 cursor-not-allowed"
                    } ${isToday ? "ring-2 ring-indigo-200" : ""}`}
                    style={{
                      backgroundColor: isCompleted ? backgroundColor || baseColor : "",
                    }}
                  >
                    {date.getDate()}
                    {isCompleted && count > 1 && (
                      <span className="absolute bottom-1 right-1 bg-white text-black rounded-full text-[8px] w-3 h-3 flex items-center justify-center">
                        {count}
                      </span>
                    )}
                  </button>
                );
              }
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