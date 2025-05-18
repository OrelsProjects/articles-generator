import { rootPath } from "@/types/navbar";
import { redirect } from "next/navigation";

export default function CancelPage() {
  redirect(rootPath);
}
