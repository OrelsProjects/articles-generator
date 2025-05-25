"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import {
  Loader2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Calendar,
  Mail,
  Target,
  BarChart3,
  CalendarDays,
  Search,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Plan } from "@prisma/client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import axiosInstance from "@/lib/axios-instance";

interface UserHitRateData {
  id: string;
  name: string;
  email: string;
  image: string | null;
  totalScheduledNotes: number;
  sentNotes: number;
  hitRate: number;
  timeSeriesData: {
    week: string;
    hitRate: number;
    scheduled: number;
    sent: number;
  }[];
  lastScheduledAt: string | null;
  plan: Plan | null;
}

interface HitRateResponse {
  users: UserHitRateData[];
  dateRange: {
    startDate: string;
    endDate: string;
    range: string;
  };
}

type SortField =
  | "hitRate"
  | "lastScheduledAt"
  | "name"
  | "totalScheduledNotes"
  | "sentNotes";
type SortDirection = "asc" | "desc" | null;

const planColors: Record<Plan, string> = {
  standard: "bg-blue-100 text-blue-800",
  premium: "bg-purple-100 text-purple-800",
  hobbyist: "bg-green-100 text-green-800",
};

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

const DATE_RANGE_OPTIONS = [
  { value: "week", label: "Last Week" },
  { value: "2weeks", label: "Last 2 Weeks" },
  { value: "month", label: "Last Month" },
  { value: "3months", label: "Last 3 Months" },
  { value: "custom", label: "Custom Range" },
];

export default function HitRatePage() {
  const [data, setData] = useState<UserHitRateData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserHitRateData | null>(
    null,
  );
  const [dateRange, setDateRange] = useState("2weeks");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [currentDateRange, setCurrentDateRange] = useState<{
    startDate: string;
    endDate: string;
    range: string;
  } | null>(null);

  // Search and sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("hitRate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const fetchHitRateData = async (
    range?: string,
    startDate?: string,
    endDate?: string,
  ) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      if (range === "custom" && startDate && endDate) {
        params.append("startDate", startDate);
        params.append("endDate", endDate);
        params.append("range", "custom");
      } else {
        params.append("range", range || dateRange);
      }

      const response = await axiosInstance.get<HitRateResponse>(
        `/api/admin/hit-rate?${params.toString()}`,
      );
      const result: HitRateResponse = response.data;
      setData(result.users);
      setCurrentDateRange(result.dateRange);
      setError(null);
    } catch (error: any) {
      setError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHitRateData();
  }, []);

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    if (value !== "custom") {
      fetchHitRateData(value);
    }
  };

  const handleCustomDateSubmit = () => {
    if (customStartDate && customEndDate) {
      fetchHitRateData("custom", customStartDate, customEndDate);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction: asc -> desc -> null -> asc
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField("hitRate"); // Default back to hit rate
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("desc"); // Default to desc for new field
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    if (sortDirection === "asc")
      return <ChevronUp className="inline-block w-4 h-4 ml-1" />;
    if (sortDirection === "desc")
      return <ChevronDown className="inline-block w-4 h-4 ml-1" />;
    return null;
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query),
      );
    }

    // Apply sorting
    if (sortField && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let valueA: any = a[sortField];
        let valueB: any = b[sortField];

        // Handle null values for lastScheduledAt
        if (sortField === "lastScheduledAt") {
          if (!valueA && !valueB) return 0;
          if (!valueA) return sortDirection === "asc" ? -1 : 1;
          if (!valueB) return sortDirection === "asc" ? 1 : -1;
          valueA = new Date(valueA).getTime();
          valueB = new Date(valueB).getTime();
        }

        // Handle string comparison for name
        if (sortField === "name") {
          valueA = valueA.toLowerCase();
          valueB = valueB.toLowerCase();
        }

        if (valueA < valueB) {
          return sortDirection === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortDirection === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [data, searchQuery, sortField, sortDirection]);

  // Calculate aggregated time series data for all users
  const aggregatedTimeSeriesData = useMemo(() => {
    const weeklyAggregated: {
      [key: string]: { scheduled: number; sent: number };
    } = {};

    filteredAndSortedData.forEach(user => {
      user.timeSeriesData.forEach(weekData => {
        if (!weeklyAggregated[weekData.week]) {
          weeklyAggregated[weekData.week] = { scheduled: 0, sent: 0 };
        }
        weeklyAggregated[weekData.week].scheduled += weekData.scheduled;
        weeklyAggregated[weekData.week].sent += weekData.sent;
      });
    });

    return Object.entries(weeklyAggregated)
      .map(([week, data]) => ({
        week,
        hitRate: data.scheduled > 0 ? (data.sent / data.scheduled) * 100 : 0,
        scheduled: data.scheduled,
        sent: data.sent,
      }))
      .sort((a, b) => new Date(a.week).getTime() - new Date(b.week).getTime());
  }, [filteredAndSortedData]);

  // Calculate overall statistics based on filtered data
  const totalUsers = filteredAndSortedData.length;
  const totalScheduledNotes = filteredAndSortedData.reduce(
    (sum, user) => sum + user.totalScheduledNotes,
    0,
  );
  const totalSentNotes = filteredAndSortedData.reduce(
    (sum, user) => sum + user.sentNotes,
    0,
  );
  const overallHitRate =
    totalScheduledNotes > 0 ? (totalSentNotes / totalScheduledNotes) * 100 : 0;

  // Hit rate distribution for pie chart (based on filtered data)
  const hitRateDistribution = [
    {
      name: "90-100%",
      value: filteredAndSortedData.filter(u => u.hitRate >= 90).length,
      color: "#00C49F",
    },
    {
      name: "70-89%",
      value: filteredAndSortedData.filter(
        u => u.hitRate >= 70 && u.hitRate < 90,
      ).length,
      color: "#0088FE",
    },
    {
      name: "50-69%",
      value: filteredAndSortedData.filter(
        u => u.hitRate >= 50 && u.hitRate < 70,
      ).length,
      color: "#FFBB28",
    },
    {
      name: "30-49%",
      value: filteredAndSortedData.filter(
        u => u.hitRate >= 30 && u.hitRate < 50,
      ).length,
      color: "#FF8042",
    },
    {
      name: "0-29%",
      value: filteredAndSortedData.filter(u => u.hitRate < 30).length,
      color: "#FF4343",
    },
  ].filter(item => item.value > 0);

  const getHitRateColor = (hitRate: number) => {
    if (hitRate >= 90) return "text-green-600";
    if (hitRate >= 70) return "text-blue-600";
    if (hitRate >= 50) return "text-yellow-600";
    if (hitRate >= 30) return "text-orange-600";
    return "text-red-600";
  };

  const getHitRateBadgeClassname = (hitRate: number) => {
    if (hitRate >= 90) return "bg-green-100 text-green-800";
    if (hitRate >= 70) return "bg-blue-100 text-blue-800";
    if (hitRate >= 50) return "bg-yellow-100 text-yellow-800";
    if (hitRate >= 30) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const formatWeekLabel = (weekString: string) => {
    const date = new Date(weekString);
    return format(date, "MMM dd");
  };

  const formatDateRange = () => {
    if (!currentDateRange) return "";
    const start = format(new Date(currentDateRange.startDate), "MMM dd, yyyy");
    const end = format(new Date(currentDateRange.endDate), "MMM dd, yyyy");
    return `${start} - ${end}`;
  };

  return (
    <div className="container mx-auto py-10 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Hit Rate Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor scheduling success rates across all users
          </p>
          {currentDateRange && (
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {formatDateRange()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() =>
              fetchHitRateData(
                dateRange === "custom" ? "custom" : dateRange,
                customStartDate,
                customEndDate,
              )
            }
            variant="outline"
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={cn("h-4 w-4", { "animate-spin": loading })} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Date Range Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Date Range Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="date-range">Select Range</Label>
              <Select value={dateRange} onValueChange={handleDateRangeChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select date range" />
                </SelectTrigger>
                <SelectContent>
                  {DATE_RANGE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {dateRange === "custom" && (
              <>
                <div className="flex-1">
                  <Label htmlFor="start-date">Start Date</Label>
                  <Input
                    id="start-date"
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date">End Date</Label>
                  <Input
                    id="end-date"
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleCustomDateSubmit}
                  disabled={!customStartDate || !customEndDate || loading}
                  className="gap-2"
                >
                  Apply Range
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="text-center text-destructive p-4 bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Users
                </CardTitle>
                <Mail className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalUsers}</div>
                <p className="text-xs text-muted-foreground">
                  {searchQuery ? "Filtered results" : "With scheduled notes"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Overall Hit Rate
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    "text-2xl font-bold",
                    getHitRateColor(overallHitRate),
                  )}
                >
                  {overallHitRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {totalSentNotes} of {totalScheduledNotes} sent
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Scheduled
                </CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalScheduledNotes}</div>
                <p className="text-xs text-muted-foreground">Notes scheduled</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Successfully Sent
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {totalSentNotes}
                </div>
                <p className="text-xs text-muted-foreground">Notes delivered</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Hit Rate Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Hit Rate Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={hitRateDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {hitRateDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Selected User Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {selectedUser
                      ? `${selectedUser.name}'s Hit Rate Trend`
                      : "Hit Rate Trend"}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {selectedUser && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUser(null)}
                        className="gap-1"
                      >
                        <BarChart3 className="h-4 w-4" />
                        Show All Users
                      </Button>
                    )}
                    {!selectedUser && filteredAndSortedData.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        Aggregated trend of {filteredAndSortedData.length} users
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {selectedUser && selectedUser.timeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={selectedUser.timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tickFormatter={formatWeekLabel} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        labelFormatter={value =>
                          `Week of ${formatWeekLabel(value as string)}`
                        }
                        formatter={(value: number) => [
                          `${value.toFixed(1)}%`,
                          "Hit Rate",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="hitRate"
                        stroke="#8884d8"
                        strokeWidth={2}
                        dot={{ fill: "#8884d8" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : aggregatedTimeSeriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={aggregatedTimeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" tickFormatter={formatWeekLabel} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip
                        labelFormatter={value =>
                          `Week of ${formatWeekLabel(value as string)}`
                        }
                        formatter={(value: number, name: string) => {
                          if (name === "hitRate") {
                            return [`${value.toFixed(1)}%`, "Overall Hit Rate"];
                          }
                          return [value, name];
                        }}
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-background border rounded-lg p-3 shadow-lg">
                                <p className="font-medium">{`Week of ${formatWeekLabel(label as string)}`}</p>
                                <p className="text-sm text-blue-600">
                                  {`Hit Rate: ${data.hitRate.toFixed(1)}%`}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {`${data.sent} sent of ${data.scheduled} scheduled`}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="hitRate"
                        stroke="#0088FE"
                        strokeWidth={3}
                        dot={{ fill: "#0088FE", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, stroke: "#0088FE", strokeWidth: 2 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    {filteredAndSortedData.length === 0
                      ? "No data available for the selected filters"
                      : "Click on a user in the table below to view their individual hit rate trend"}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6 w-full">
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 w-full"
                />
                {searchQuery && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    {filteredAndSortedData.length} results
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>User Hit Rates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort("name")}
                      >
                        User
                        {renderSortIcon("name")}
                      </TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead
                        className="text-center cursor-pointer select-none"
                        onClick={() => handleSort("hitRate")}
                      >
                        Hit Rate
                        {renderSortIcon("hitRate")}
                      </TableHead>
                      <TableHead
                        className="text-center cursor-pointer select-none"
                        onClick={() => handleSort("sentNotes")}
                      >
                        Sent
                        {renderSortIcon("sentNotes")}
                      </TableHead>
                      <TableHead
                        className="text-center cursor-pointer select-none"
                        onClick={() => handleSort("totalScheduledNotes")}
                      >
                        Scheduled
                        {renderSortIcon("totalScheduledNotes")}
                      </TableHead>
                      <TableHead
                        className="cursor-pointer select-none"
                        onClick={() => handleSort("lastScheduledAt")}
                      >
                        Last Scheduled
                        {renderSortIcon("lastScheduledAt")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedData.map(user => (
                      <TableRow
                        key={user.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          selectedUser?.id === user.id && "bg-muted",
                        )}
                        onClick={() => setSelectedUser(user)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.image || undefined} />
                              <AvatarFallback>
                                {user.name
                                  .split(" ")
                                  .map(n => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{user.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.plan ? (
                            <Badge
                              variant="outline"
                              className={planColors[user.plan]}
                            >
                              {user.plan}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={getHitRateBadgeClassname(user.hitRate)}
                          >
                            {user.hitRate.toFixed(1)}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {user.sentNotes}
                        </TableCell>
                        <TableCell className="text-center font-medium">
                          {user.totalScheduledNotes}
                        </TableCell>
                        <TableCell>
                          {user.lastScheduledAt ? (
                            <span className="text-sm">
                              {format(
                                new Date(user.lastScheduledAt),
                                "MMM dd, yyyy",
                              )}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {filteredAndSortedData.length === 0 && searchQuery && (
                <div className="text-center py-8 text-muted-foreground">
                  No users found matching &ldquo;{searchQuery}&rdquo;
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
