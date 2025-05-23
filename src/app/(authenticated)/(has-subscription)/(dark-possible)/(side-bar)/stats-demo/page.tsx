"use client";

import { NotesReactionsChart } from "@/components/stats/NotesReactionsChart";

export default function StatsDemoPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Notes Statistics Dashboard</h1>
        <p className="text-muted-foreground">
          Track your notes performance and engagement over time
        </p>
      </div>
      
      <div className="grid gap-6">
        <NotesReactionsChart />
      </div>
    </div>
  );
} 