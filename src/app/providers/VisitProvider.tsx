import axios from "axios";
import useSWR from "swr";

const fetcher = (url: string) => axios.post(url).then(res => res.data);

export default function VisitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useSWR("/api/visit", fetcher);

  return children;
}
