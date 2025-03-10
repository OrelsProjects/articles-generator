import prisma from "@/app/api/_db/db";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "Updated" });
}
