"use client";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  RefreshCw,
  Search,
  AlertTriangle,
  User,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { differenceInDays, format } from "date-fns";
import { InspirationFilters } from "@/types/note";
import { TooltipButton } from "@/components/ui/tooltip-button";
import { InfoCircledIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { WriterSearchBar } from "@/components/ui/inspiration-filter/writer-search-bar";

interface InspirationFilterDialogProps {
  filters: InspirationFilters;
  loading: boolean;
  onFilterChange: (filters?: Partial<InspirationFilters>) => void;
}

const likesOptions = [
  { label: "0 likes", value: "0" },
  { label: "25 likes", value: "25" },
  { label: "50 likes", value: "50" },
  { label: "100 likes", value: "100" },
  { label: "250 likes", value: "250" },
  { label: "500 likes", value: "500" },
  { label: "1k likes", value: "1000", limitedResults: true },
  { label: "2k likes", value: "2000", limitedResults: true },
  { label: "5k likes", value: "5000", limitedResults: true },
];

const commentsOptions = [
  { label: "0 comments", value: "0" },
  { label: "5 comment", value: "5" },
  { label: "10 comments", value: "10" },
  { label: "25 comments", value: "25" },
  { label: "50 comments", value: "50" },
  { label: "100 comments", value: "100", limitedResults: true },
  { label: "1k comments", value: "1000", limitedResults: true },
];

const restacksOptions = [
  { label: "0 restacks", value: "0" },
  { label: "5 restacks", value: "5" },
  { label: "10 restacks", value: "10" },
  { label: "25 restacks", value: "25" },
  { label: "50 restacks", value: "50" },
  { label: "100 restacks", value: "100", limitedResults: true },
  { label: "1k restacks", value: "1000", limitedResults: true },
];

export function InspirationFilterDialog({
  filters,
  onFilterChange,
  loading,
}: InspirationFilterDialogProps) {
  const [newFilters, setNewFilters] =
    useState<Partial<InspirationFilters>>(filters);
  const [dateRange, setDateRange] = useState<DateRange | null | undefined>(
    filters?.dateRange,
  );
  const [openCalendar, setOpenCalendar] = useState(false);
  const [selectedSection, setSelectedSection] = useState<"writer" | "keyword">(
    "keyword",
  );

  const likes = newFilters?.minLikes || 0;
  const comments = newFilters?.minComments || 0;
  const restacks = newFilters?.minRestacks || 0;
  const keyword = newFilters?.keyword || "";

  const hasFilters =
    likes > 0 || comments > 0 || restacks > 0 || keyword || dateRange;

  useEffect(() => {
    let filtersToUpdate = { ...filters };
    for (const key in filters) {
      const valueNew = filters[key as keyof InspirationFilters];
      const valueCurrent = newFilters[key as keyof InspirationFilters];
      const hasChanged = valueNew !== valueCurrent;
      if (hasChanged) {
        (filtersToUpdate as any)[key] = valueNew;
      }
    }
    setNewFilters(filtersToUpdate);
  }, [filters]);

  const handleFilterChange = (key: keyof InspirationFilters, value: string) => {
    let newType =
      key === "type" ? (value as "all" | "relevant-to-user") : filters?.type;
    newType = newType || "all";
    setNewFilters({
      ...newFilters,
      type: newType,
      [key]:
        key === "minLikes" || key === "minComments" || key === "minRestacks"
          ? Number.parseInt(value)
          : value,
    });
  };

  const handleApplyFilters = () => {
    if (newFilters) {
      let filters = { ...newFilters };
      if (dateRange) {
        filters = {
          ...newFilters,
          dateRange: dateRange,
        };
      }
      onFilterChange(filters);
    } else {
      onFilterChange();
    }
  };

  const dateInputValue = useMemo(() => {
    if (dateRange) {
      if (dateRange.from && dateRange.to) {
        return `${format(dateRange.from, "yyyy-MM-dd")} ~ ${format(
          dateRange.to,
          "yyyy-MM-dd",
        )}`;
      }
      if (dateRange.from) {
        return `${format(dateRange.from, "yyyy-MM-dd")} ~ Today`;
      }
    }
    return "";
  }, [dateRange]);

  const hasLimitedResults = useMemo(() => {
    const selectedComment = commentsOptions.find(
      opt => opt.value === comments.toString(),
    );
    const selectedRestack = restacksOptions.find(
      opt => opt.value === restacks.toString(),
    );
    const selectedLikes = likesOptions.find(
      opt => opt.value === likes.toString(),
    );

    // If range is lower than 30 days, it's also limited
    let isDateLimited = false;
    if (dateRange) {
      if (dateRange.from && dateRange.to) {
        isDateLimited = differenceInDays(dateRange.to, dateRange.from) < 365;
      } else if (dateRange.from) {
        const difference = differenceInDays(new Date(), dateRange.from);
        isDateLimited = difference < 30;
      }
    }

    return (
      selectedComment?.limitedResults ||
      selectedRestack?.limitedResults ||
      selectedLikes?.limitedResults ||
      isDateLimited
    );
  }, [comments, restacks, likes, dateRange]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant={"neumorphic-primary"} className="gap-2">
          Advanced Search
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] p-10 gap-1" hideCloseButton>
        <div
          className={cn("border border-border rounded-md transition-all", {
            "opacity-50": selectedSection === "writer",
          })}
          onClick={() => setSelectedSection("keyword")}
        >
          {/* Search bar */}
          <div className="flex justify-between items-center gap-2 border-b border-border py-2 px-4">
            <div className="w-full flex flex-col  items-start">
              <div className="w-full relative flex-1">
                <Input
                  placeholder="Search a term or phrase to see similar posts..."
                  className="pl-8 pr-4 h-10 border-none shadow-none focus-visible:ring-0"
                  value={keyword}
                  maxLength={120}
                  onChange={e => handleFilterChange("keyword", e.target.value)}
                />
                <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Search className="h-4 w-4" />
                </div>
              </div>
            </div>
            <DialogTrigger asChild>
              <TooltipButton
                variant="outline-primary"
                onClick={handleApplyFilters}
                hideTooltip
                disabled={loading}
              >
                {loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                Search
              </TooltipButton>
            </DialogTrigger>
          </div>

          {/* Filter row */}
          <div className="w-full grid grid-cols-2 border-b border-border py-2 px-4">
            <div className="w-full grid grid-cols-[1fr_auto] gap-4 col-span-2">
              <div className="relative">
                <Input
                  placeholder="Anytime"
                  className="h-10 shadow-none border-none !ring-none z-10"
                  value={dateInputValue}
                  disabled
                />
                <div
                  className="absolute inset-0 z-20 cursor-pointer"
                  onClick={() => {
                    setOpenCalendar(!openCalendar);
                  }}
                />
              </div>
              <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <CalendarIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <Calendar
                    mode="range"
                    selected={dateRange || undefined}
                    onSelect={setDateRange}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {/* Dropdown filters */}
          <div className="grid grid-cols-3 gap-4 py-2 px-4">
            <Select
              value={likes.toString()}
              onValueChange={value => handleFilterChange("minLikes", value)}
            >
              <SelectTrigger className="h-10 shadow-none border-0 border-r border-border rounded-none">
                <SelectValue placeholder="100 Likes" />
              </SelectTrigger>
              <SelectContent>
                {likesOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={comments.toString()}
              onValueChange={value => handleFilterChange("minComments", value)}
            >
              <SelectTrigger className="h-10 shadow-none border-0 border-r border-border rounded-none">
                <SelectValue placeholder="10 Comments" />
              </SelectTrigger>
              <SelectContent>
                {commentsOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={restacks.toString()}
              onValueChange={value => handleFilterChange("minRestacks", value)}
            >
              <SelectTrigger className="h-10 shadow-none border-0">
                <SelectValue placeholder="10 restacks" />
              </SelectTrigger>
              <SelectContent>
                {restacksOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Writer search */}
        <div
          className={cn(
            "flex items-center justify-between border border-border rounded-md mt-4 transition-all",
            {
              "opacity-50": selectedSection === "keyword",
            },
          )}
          onClick={() => setSelectedSection("writer")}
        >
          <div className="w-full flex justify-between items-center gap-2 py-2 px-4">
            <div className="w-full flex flex-col items-start">
              <WriterSearchBar />
            </div>
          </div>
        </div>

        {hasFilters && (
          <div className="w-full flex justify-end cursor-pointer">
            <Button
              variant="link"
              className="h-auto p-0 text-sm hover:text-primary"
              onClick={() => {
                setNewFilters({});
                setDateRange(null);
              }}
            >
              Clear filters
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
