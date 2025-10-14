"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import HabitForm from "@/components/HabitForm";
import HabitList from "@/components/HabitList";
import CalendarHeatmap from "@/components/CalendarHeatmap";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [habits, setHabits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchHabits();
    }
  }, [status, router]);

  const fetchHabits = async () => {
    try {
      const response = await fetch("/api/habits");
      if (response.ok) {
        const data = await response.json();
        setHabits(data);
      }
    } catch (error) {
      console.error("Error fetching habits:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-indigo-600 mx-auto"></div>
          <p className="mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            HabitQ Dashboard
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsFormOpen(true)}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Add Habit
            </button>
            <div className="text-sm">
              {session?.user?.name ? `Hello, ${session.user.name}` : ""}
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Your Habits</h2>
              <HabitList habits={habits} onHabitsChange={fetchHabits} />
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Habit Tracker</h2>
              <CalendarHeatmap habits={habits} onHabitsChange={fetchHabits} />
            </div>
          </div>
        </div>
      </main>

      {isFormOpen && (
        <HabitForm
          onClose={() => setIsFormOpen(false)}
          onHabitCreated={fetchHabits}
        />
      )}
    </div>
  );
}