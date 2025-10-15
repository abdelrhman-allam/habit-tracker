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
  const [githubView, setGithubView] = useState(true);

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

  // Helper to get completion info for a specific habit's logs
  const getCompletionInfoForLogs = (logs: HabitLog[], date: Date) => {
    const dateString = date.toISOString().split("T")[0];
    const logsForDate = logs.filter(
      (log) => {
        const d = typeof log.date === 'string' ? new Date(log.date) : new Date(log.date);
        const ds = d.toISOString().split('T')[0];
        return ds === dateString && log.completed;
      }
    );
    return {
      isCompleted: logsForDate.length > 0,
      count: logsForDate.length,
    };
  };

  // Generate weeks covering the last year (GitHub-style)
  const generateLastYearWeeks = () => {
    const end = new Date();
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(end.getDate() - 365);
    // Align start to previous Sunday for 7-row grid
    while (start.getDay() !== 0) {
      start.setDate(start.getDate() - 1);
    }

    const weeks: Date[][] = [];
    let week: Date[] = [];
    const iter = new Date(start);
    while (iter <= end) {
      week.push(new Date(iter));
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      iter.setDate(iter.getDate() + 1);
    }
    if (week.length) {
      // Fill remaining days to complete the last week (beyond end)
      while (week.length < 7) {
        week.push(new Date(iter));
        iter.setDate(iter.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  };

  const toggleHabitCompletionForHabit = async (habitId: string, date: Date) => {
    try {
      const dateString = date.toISOString().split("T")[0];
      const logs = allHabitLogs[habitId] || [];
      const { isCompleted } = getCompletionInfoForLogs(logs, date);
      const response = await fetch("/api/logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ habitId, date: dateString, completed: !isCompleted }),
      });
      if (response.ok) {
        await fetchHabitLogs(habitId);
        await fetchAllHabitLogs();
      }
    } catch (error) {
      console.error("Error toggling habit completion:", error);
    }
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
        
        <div className="flex items-center gap-6">
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

          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              checked={githubView} 
              onChange={() => setGithubView(!githubView)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            <span className="ms-3 text-sm font-medium text-gray-700">GitHub Grid</span>
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

          {githubView ? (
            // GitHub-style year grid view with month and day labels
            (() => {
              const weeks = generateLastYearWeeks();
              const monthLabelForWeek = (week: Date[]) => {
                const firstOfMonth = week.find((d) => d.getDate() === 1);
                return firstOfMonth
                  ? firstOfMonth.toLocaleString('default', { month: 'short' })
                  : '';
              };

              const DayLabels = () => (
                <div className="flex flex-col mr-2 text-[10px] text-gray-500 select-none">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={`dl-${i}`} className="h-3 md:h-4 flex items-center">
                      {(i === 1 || i === 3 || i === 5) ?
                        (i === 1 ? 'Mon' : i === 3 ? 'Wed' : 'Fri') : ''}
                    </div>
                  ))}
                </div>
              );

              const MonthsRow = () => (
                <div className="flex gap-1 mb-1 ml-[1.25rem]">
                  {weeks.map((week, wIdx) => (
                    <div key={`m-${wIdx}`} className="w-3 md:w-4 text-[10px] text-gray-500">
                      {monthLabelForWeek(week)}
                    </div>
                  ))}
                </div>
              );

              if (showAllHabits) {
                return (
                  <div className="space-y-4 overflow-x-auto pt-1">
                    {habits.map((habit) => {
                      const logs = allHabitLogs[habit.id] || [];
                      return (
                        <div key={`habit-grid-${habit.id}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: habit.color }}></div>
                            <span className="text-sm text-gray-700">{habit.title}</span>
                          </div>
                          <MonthsRow />
                          <div className="flex">
                            <DayLabels />
                            <div className="flex gap-1">
                              {weeks.map((week, wIdx) => (
                                <div key={`week-${habit.id}-${wIdx}`} className="flex flex-col gap-1">
                                  {week.map((date, dIdx) => {
                                    const { isCompleted, count } = getCompletionInfoForLogs(logs, date);
                                    const isToday = date.toDateString() === new Date().toDateString();
                                    const isPast = date <= new Date();
                                    const r = parseInt(habit.color.slice(1, 3), 16);
                                    const g = parseInt(habit.color.slice(3, 5), 16);
                                    const b = parseInt(habit.color.slice(5, 7), 16);
                                    const intensity = count === 1 ? 0.7 : count === 2 ? 0.85 : count >= 3 ? 1 : 0;
                                    const backgroundColor = isCompleted ? `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * intensity)})` : '#eef2ff';
                                    return (
                                      <button
                                        key={`cell-${habit.id}-${wIdx}-${dIdx}`}
                                        onClick={() => toggleHabitCompletionForHabit(habit.id, date)}
                                        disabled={!isPast && !isToday}
                                        className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${isCompleted ? '' : 'border border-gray-200'} ${isToday ? 'ring-1 ring-indigo-300' : ''}`}
                                        style={{ backgroundColor }}
                                        title={`${habit.title} • ${date.toLocaleDateString()} • ${count}x`}
                                      />
                                    );
                                  })}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              }

              // Single selected habit grid
              const baseColor = getSelectedHabitColor();
              const r = parseInt(baseColor.slice(1, 3), 16);
              const g = parseInt(baseColor.slice(3, 5), 16);
              const b = parseInt(baseColor.slice(5, 7), 16);
              return (
                <div className="overflow-x-auto pt-1">
                  <MonthsRow />
                  <div className="flex">
                    <DayLabels />
                    <div className="flex gap-1">
                      {weeks.map((week, wIdx) => (
                        <div key={`week-${wIdx}`} className="flex flex-col gap-1">
                          {week.map((date, dIdx) => {
                            const { isCompleted, count } = getDateCompletionInfo(date);
                            const isToday = date.toDateString() === new Date().toDateString();
                            const isPast = date <= new Date();
                            const intensity = count === 1 ? 0.7 : count === 2 ? 0.85 : count >= 3 ? 1 : 0;
                            const backgroundColor = isCompleted ? `rgb(${Math.round(r * intensity)}, ${Math.round(g * intensity)}, ${Math.round(b * intensity)})` : '#eef2ff';
                            return (
                              <button
                                key={`cell-${wIdx}-${dIdx}`}
                                onClick={() => toggleHabitCompletion(date)}
                                disabled={!isPast && !isToday}
                                className={`w-3 h-3 md:w-4 md:h-4 rounded-sm ${isCompleted ? '' : 'border border-gray-200'} ${isToday ? 'ring-1 ring-indigo-300' : ''}`}
                                style={{ backgroundColor }}
                                title={`${date.toLocaleDateString()} • ${count}x`}
                              />
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
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
          )}

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