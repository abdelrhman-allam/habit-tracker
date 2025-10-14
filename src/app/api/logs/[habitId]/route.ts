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

    const logs = await prisma.habitLog.findMany({
      where: { habitId: params.habitId },
      orderBy: { date: "asc" },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Error fetching habit logs:", error);
    return NextResponse.json(
      { error: "Failed to fetch habit logs" },
      { status: 500 }
    );
  }
}