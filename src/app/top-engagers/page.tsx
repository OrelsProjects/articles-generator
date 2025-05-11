"use client";

import React, { useEffect, useState } from "react";
import TopEngagers from "./components/top-engagers";
import DemoCard from "./components/demo-card";
import { Engager } from "@/types/engager";
import axios from "axios";
import { Skeleton } from "@/components/ui/skeleton";

function TopEngagersPage() {
  const [engagers, setEngagers] = useState<Engager[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEngagers = async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/v1/top-engagers");
        setEngagers(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchEngagers();
  }, []);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-3xl font-bold text-foreground">
            Top Engagers Component
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Beautiful overlapping avatar circles showing user engagement
          </p>
        </header>

        <DemoCard title="Top followers">
          <TopEngagers
            engagers={engagers}
            showFakes={true}
            title="Top followers"
            className="mb-6"
            loading={loading}
          />
        </DemoCard>

        <footer className="mt-16 text-center text-sm text-muted-foreground">
          <p>Hover over any avatar to see more information about the engager</p>
        </footer>
      </div>
    </div>
  );
}

export default TopEngagersPage;
