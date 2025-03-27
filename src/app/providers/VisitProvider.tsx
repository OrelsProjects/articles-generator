import axios from "axios";
import { useEffect } from "react";

const fetcher = (url: string) => axios.post(url).then(res => res.data);

export default function VisitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    fetcher("/api/visit");
  }, []);

  return children;
}
