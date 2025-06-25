import { useCustomRouter } from "@/lib/hooks/useCustomRouter";
import { rootPath } from "@/types/navbar";
import { useEffect } from "react";

export default function CancelPage() {
  const router = useCustomRouter();
  useEffect(() => {
    router.redirect(rootPath);
  }, []);
}
