import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function QueuePage() {
  useEffect(() => {
    redirect("/notes?view=list");
  }, []);
}
