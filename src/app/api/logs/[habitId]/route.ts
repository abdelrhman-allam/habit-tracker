import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// GET logs for a specific habit
export async function GET(
  request: Request,
  { params }: { params: { habitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if the habit belongs to the user
    const habit = await prisma.habit.findUnique({
      where: { id: params.habitId },
    });

    if (!habit || habit.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get all logs for the habit
    const logs = await prisma.habitLog.findMany({
      where: { habitId: params.habitId },
      orderBy: { date: "asc" },
    });

    // Process logs to count completions per day
     const processedLogs = logs.reduce((acc, log) => {
       const dateString = new Date(log.date).toISOString().split('T')[0];
       
       // Find if we already have an entry for this date
       const existingLogIndex = acc.findIndex(
         (item) => new Date(item.date).toISOString().split('T')[0] === dateString
       );
      
      if (existingLogIndex >= 0) {
        // If the log is completed, increment the count
        if (log.completed) {
          acc[existingLogIndex].count = (acc[existingLogIndex].count || 1) + 1;
        }
      } else {
        // Add a new entry with count 1 if completed
        acc.push({
          ...log,
          count: log.completed ? 1 : 0
        });
      }
      
      return acc;
    }, []);

    return NextResponse.json(processedLogs);
  } catch (error) {
    console.error("Error fetching habit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch habit logs" },
      { status: 500 }
    );
  }
}