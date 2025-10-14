"use client";

import { useState } from "react";
import HabitForm from "./HabitForm";

interface Habit {
  id: string;
  title: string;
  description: string;
  color: string;
  frequency: string;
}

interface HabitListProps {
  habits: Habit[];
  onHabitsChange: () => void;
}

export default function HabitList({ habits, onHabitsChange }: HabitListProps) {
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this habit?")) return;

    try {
      const response = await fetch(`/api/habits/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        onHabitsChange();
      }
    } catch (error) {
      console.error("Error deleting habit:", error);
    }
  };

  if (habits.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">No habits yet. Add your first habit!</p>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-gray-200">
        {habits.map((habit) => (
          <li key={habit.id} className="py-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div
                  className="h-4 w-4 rounded-full mt-1"
                  style={{ backgroundColor: habit.color }}
                ></div>
                <div>
                  <h3 className="text-sm font-medium">{habit.title}</h3>
                  {habit.description && (
                    <p className="text-xs text-gray-500 mt-1">
                      {habit.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    {habit.frequency.charAt(0).toUpperCase() +
                      habit.frequency.slice(1)}
                  </p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setEditingHabit(habit)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => handleDelete(habit.id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editingHabit && (
        <HabitForm
          habit={editingHabit}
          onClose={() => setEditingHabit(null)}
          onHabitCreated={onHabitsChange}
        />
      )}
    </div>
  );
}