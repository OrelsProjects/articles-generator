"use client";

import { useEffect, useState } from "react";
import { useAppSelector } from "@/lib/hooks/redux";
import { selectAuth } from "@/lib/features/auth/authSlice";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { ArrowUpRight, BookOpen, Edit3, FileText, Plus } from "lucide-react";

// Mock data for charts
const weeklyActivity = [
  { name: "Mon", notes: 4 },
  { name: "Tue", notes: 3 },
  { name: "Wed", notes: 7 },
  { name: "Thu", notes: 5 },
  { name: "Fri", notes: 6 },
  { name: "Sat", notes: 2 },
  { name: "Sun", notes: 3 },
];

const monthlyActivity = [
  { name: "Week 1", notes: 15 },
  { name: "Week 2", notes: 20 },
  { name: "Week 3", notes: 18 },
  { name: "Week 4", notes: 25 },
];

export default function DashboardPage() {
  const { user } = useAppSelector(selectAuth);
  const [activeTab, setActiveTab] = useState("weekly");
  
  // Mock recent notes data
  const recentNotes = [
    { id: 1, title: "Meeting Notes: Product Launch", date: "Today, 10:30 AM", words: 450 },
    { id: 2, title: "Project Roadmap Q3", date: "Yesterday, 3:15 PM", words: 820 },
    { id: 3, title: "Client Feedback Summary", date: "2 days ago", words: 340 },
    { id: 4, title: "Research: Market Trends", date: "3 days ago", words: 1250 },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Note
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold">42</div>
              <div className="ml-auto bg-muted p-2 rounded-full">
                <FileText className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Words Written</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold">24,568</div>
              <div className="ml-auto bg-muted p-2 rounded-full">
                <Edit3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reading Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <div className="text-3xl font-bold">123 min</div>
              <div className="ml-auto bg-muted p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Activity</CardTitle>
            <CardDescription>Your note creation activity over time</CardDescription>
            <Tabs defaultValue="weekly" onValueChange={setActiveTab} className="mt-2">
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={activeTab === "weekly" ? weeklyActivity : monthlyActivity}
                margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="notes" fill="#8884d8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Your writing performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Avg. Words per Note</p>
                  <p className="text-sm text-muted-foreground">585 words</p>
                </div>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">12%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Notes This Week</p>
                  <p className="text-sm text-muted-foreground">12 notes</p>
                </div>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">8%</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium leading-none">Current Streak</p>
                  <p className="text-sm text-muted-foreground">5 days</p>
                </div>
                <div className="flex items-center text-green-500">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">2 days</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Notes</CardTitle>
          <CardDescription>Your most recently created and edited notes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentNotes.map(note => (
              <div key={note.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                <div>
                  <h3 className="font-medium">{note.title}</h3>
                  <p className="text-sm text-muted-foreground">{note.date} • {note.words} words</p>
                </div>
                <Button variant="ghost" size="icon">
                  <Edit3 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4">
            View All Notes
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 