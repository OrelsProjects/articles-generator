"use client";

import { Button } from "@/components/ui/button";
import TextEditor from "@/components/ui/text-editor";
import axios from "axios";
import React, { useState } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await axios.post("api/user/analyze", {
        // substackUrl: "https://theindiepreneur.substack.com",
        substackUrl: "https://emdiary.substack.com/",
      });
      setArticles(res.data);
    } catch (error) {
      toast.error("Error analyzing articles");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Button onClick={analyze}>Analyze</Button>
      <TextEditor />
    </div>
  );
}
