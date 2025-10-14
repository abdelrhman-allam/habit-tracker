import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../auth/[...nextauth]/route";

const prisma = new PrismaClient();

// POST create or update a habit log
export async function POST(request: Request) {
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

    const body = await request.json();
    const { habitId, date, completed } = body;

    if (!habitId || !date) {
      return NextResponse.json(
        { error: "Habit ID and date are required" },
        { status: 400 }
      );
    }

    // Check if the habit belongs to the user
    const habit = await prisma.habit.findUnique({
      where: { id: habitId },
    });

    if (!habit || habit.userId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if a log already exists for this habit and date
    const existingLog = await prisma.habitLog.findFirst({
      where: {
        habitId,
        date: new Date(date),
      },
    });

    let log;

    if (existingLog) {
      // Update existing log
      log = await prisma.habitLog.update({
        where: { id: existingLog.id },
        data: { completed },
      });
    } else {
      // Create new log
      log = await prisma.habitLog.create({
        data: {
          habitId,
          date: new Date(date),
          completed: completed !== undefined ? completed : true,
        },
      });
    }

    return NextResponse.json(log);
  } catch (error) {
    console.error("Error creating/updating habit log:", error);
    return NextResponse.json(
      { error: "Failed to create/update habit log" },
      { status: 500 }
    );
  }
}