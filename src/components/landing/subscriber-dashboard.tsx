"use client";

import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { format, eachDayOfInterval, subDays } from "date-fns";

interface SubscriberChartProps {
  growth?: "slow" | "fast";
}

export default function SubscriberDashboard() {
  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
        {/* All Subscribers Card */}
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-1">4,174</h2>
            <div className="text-gray-500 mb-4 flex items-center gap-2">
              All subscribers
              <ArrowRight className="h-4 w-4" />
            </div>
            <Button
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 border-gray-200"
            >
              Export
            </Button>
          </CardContent>
        </Card>

        {/* Paid Subscribers Card */}
        <Card className="bg-white">
          <CardContent className="pt-6 flex flex-col items-center">
            <h2 className="text-4xl font-bold mb-1">5</h2>
            <div className="text-gray-500 mb-4">Paid subscribers</div>
            <Button
              variant="outline"
              className="bg-gray-100 hover:bg-gray-200 border-gray-200"
            >
              Export
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Growth Chart Section */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Growth over time</h2>

        <div className="w-[600px] flex justify-between items-center mb-4">
          <Tabs defaultValue="all-subscribers" className="w-full">
            <TabsList className="bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
              <TabsTrigger
                value="gross-revenue"
                className="data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                Gross annualized revenue
              </TabsTrigger>
              <TabsTrigger
                value="paid-subscribers"
                className="data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                Paid subscribers
              </TabsTrigger>
              <TabsTrigger
                value="all-subscribers"
                className="data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                All subscribers
              </TabsTrigger>
              <TabsTrigger
                value="all-followers"
                className="data-[state=inactive]:bg-transparent data-[state=inactive]:text-gray-500 rounded-none border-b-2 border-transparent data-[state=active]:border-black data-[state=active]:bg-transparent px-4 py-2"
              >
                All followers
              </TabsTrigger>
            </TabsList>

            <div className="absolute right-0 top-0">
              <Select defaultValue="90">
                <SelectTrigger className="w-[120px] border-gray-200">
                  <SelectValue placeholder="90 days" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                  <SelectItem value="180">180 days</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <TabsContent value="all-subscribers" className="mt-6">
              <SubscriberChart growth="fast" />
            </TabsContent>
            <TabsContent value="paid-subscribers" className="mt-6">
              <SubscriberChart growth="slow" />
            </TabsContent>
            <TabsContent value="gross-revenue" className="mt-6">
              <RevenueChart />
            </TabsContent>
            <TabsContent value="all-followers" className="mt-6">
              <FollowersChart />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function SubscriberChart({ growth = "slow" }: SubscriberChartProps) {
  const generateData = () => {
    // 180 days total
    const endDate = new Date();
    const startDate = subDays(endDate, growth === "fast" ? 90 : 180);
    const dates = eachDayOfInterval({ start: startDate, end: endDate });
    const totalDays = dates.length - 1;

    if (growth === "slow") {
      //
      // SLOW GROWTH: 0 → 97 linearly over 180 days, mild wobbles
      //
      const startValue = 0;
      const endValue = 97;

      return dates.map((date, index) => {
        const progress = index / totalDays;
        let value = startValue + (endValue - startValue) * progress;

        // Mild wobbles throughout
        value += Math.sin(index * 0.25) * 3;
        value += (Math.random() - 0.5) * 3;

        // Final day exactly endValue
        if (index === totalDays) {
          value = endValue;
        }

        // Clamp min
        value = Math.max(0, value);

        return {
          date,
          subscribers: Math.round(value),
        };
      });
    } else {
      //
      // FAST GROWTH:
      // 1) First 90 days: wobbly linear from 0 → 200
      // 2) Last 90 days: exponential from 200 → 1017
      //
      const startValue = 0;
      const midValue = 0;
      const endValue = 10017;
      const phaseSplit = 0; // first half ends at index=89

      return dates.map((date, index) => {
        let value: number;

        if (index < phaseSplit) {
          // PHASE 1: 0 → 200 w/ big wobbles
          const progress = index / (phaseSplit - 1);
          value = startValue + (midValue - startValue) * progress;

          // Sizable amplitude so it's clearly wobbly on a 0..1200 scale
          value += Math.sin(index * 0.4) * 15;
          value += (Math.random() - 0.5) * 15;

          // Force day 89 exactly 200
          if (index === phaseSplit - 1) {
            value = midValue;
          }
        } else {
          // PHASE 2: 200 → 1017 (rocket)
          // index=90..179 => progress2=0..1
          // exponent=5 => even steeper final climb
          const progress2 = (index - phaseSplit) / (totalDays - phaseSplit);
          const exponent = 5;
          const poweredProgress = Math.pow(progress2, exponent);

          value = midValue + (endValue - midValue) * poweredProgress;

          // Some noise in the early part of phase 2, fading out by the final day
          if (index < totalDays) {
            const fadeFactor = 1 - progress2;
            value += Math.sin(index * 0.2) * 5 * fadeFactor;
            value += (Math.random() - 0.5) * 5 * fadeFactor;
          }

          // Final day exactly 1017
          if (index === totalDays) {
            value = endValue;
          }
        }

        value = Math.max(0, value);

        return {
          date,
          subscribers: Math.round(value),
        };
      });
    }
  };

  const data = generateData();

  // About 7 X-axis ticks across 180 days
  const numberOfXTicks = growth === "fast" ? 3 : 7;
  const step = Math.floor(data.length / numberOfXTicks);
  const xTicks = data
    .filter((_, i) => i % step === 0)
    .map(d => d.date.getTime());

  // Hard-code the domain so we can see up to ~1017 for fast
  const yDomain = growth === "fast" ? [0, 11000] : [0, 120];

  return (
    <div className="w-full h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="0" stroke="#f0f0f0" />
          <XAxis
            dataKey="date"
            tickFormatter={date => format(new Date(date), "MMM dd, yyyy")}
            ticks={xTicks}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#d1d5db" }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: "#6b7280", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "#d1d5db" }}
          />
          <Line
            type="monotone"
            dataKey="subscribers"
            stroke="#000"
            dot={false}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueChart() {
  // Placeholder for revenue chart
  return (
    <div className="w-full h-[300px] flex items-center justify-center border border-dashed border-gray-200 rounded-md">
      <p className="text-gray-500">Revenue chart would appear here</p>
    </div>
  );
}

function FollowersChart() {
  // Placeholder for followers chart
  return (
    <div className="w-full h-[300px] flex items-center justify-center border border-dashed border-gray-200 rounded-md">
      <p className="text-gray-500">Followers chart would appear here</p>
    </div>
  );
}
