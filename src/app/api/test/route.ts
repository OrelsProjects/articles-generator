import { sendMail } from "@/lib/mail/mail";
import { welcomeTemplate } from "@/lib/mail/templates";
import { NextResponse } from "next/server";
export async function GET() {
  await sendMail(
    "orelsmail@gmail.com",
    process.env.NEXT_PUBLIC_APP_NAME as string,
    "Payment confirmation",
    welcomeTemplate(),
  );
  return NextResponse.json({ message: "Email sent" });
}
