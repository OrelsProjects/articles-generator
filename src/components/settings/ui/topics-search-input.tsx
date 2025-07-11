"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface TopicsSearchInputProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  placeholder?: string;
  label?: string;
  maxTopics?: number;
}

export default function TopicsSearchInput({
  selectedTopics,
  onTopicsChange,
  placeholder = "Search topics...",
  label = "Topics",
  maxTopics = 10,
}: TopicsSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetch(
          `/api/v1/topics/search?q=${encodeURIComponent(query)}&limit=10`
        );
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.topics || []);
        } else {
          setSearchResults([]);
        }
      } catch (error) {
        console.error("Error searching topics:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  // Search when query changes
  useEffect(() => {
    debouncedSearch(searchQuery);
  }, [searchQuery, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    setShowResults(true);
  };

  const handleInputFocus = () => {
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding results to allow for clicks
    setTimeout(() => setShowResults(false), 200);
  };

  const handleAddTopic = (topic: string) => {
    if (!selectedTopics.includes(topic) && selectedTopics.length < maxTopics) {
      onTopicsChange([...selectedTopics, topic]);
      setSearchQuery("");
      setShowResults(false);
    }
  };

  const handleRemoveTopic = (topicToRemove: string) => {
    onTopicsChange(selectedTopics.filter(topic => topic !== topicToRemove));
  };

  const handleAddCustomTopic = () => {
    const customTopic = searchQuery.trim();
    if (
      customTopic &&
      !selectedTopics.includes(customTopic) &&
      selectedTopics.length < maxTopics
    ) {
      onTopicsChange([...selectedTopics, customTopic]);
      setSearchQuery("");
      setShowResults(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      e.preventDefault();
      handleAddCustomTopic();
    }
  };

  const filteredResults = searchResults.filter(
    topic => !selectedTopics.includes(topic)
  );

  return (
    <div className="space-y-3">
      {label && <Label>{label}</Label>}
      
      <div className="relative">
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
          />
          {searchQuery.trim() && (
            <Button
              type="button"
              onClick={handleAddCustomTopic}
              disabled={selectedTopics.length >= maxTopics}
              size="sm"
            >
              Add
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchQuery.trim() || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {isSearching ? (
              <div className="p-3 text-sm text-muted-foreground">
                Searching...
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="py-1">
                {filteredResults.map(topic => (
                  <button
                    key={topic}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                    onClick={() => handleAddTopic(topic)}
                    disabled={selectedTopics.length >= maxTopics}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            ) : searchQuery.trim() ? (
              <div className="p-3 text-sm text-muted-foreground">
                No topics found. Press Enter to add as custom topic.
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Selected Topics */}
      {selectedTopics.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Selected topics ({selectedTopics.length}/{maxTopics})
            </span>
            {selectedTopics.length >= maxTopics && (
              <span className="text-xs text-muted-foreground">
                Maximum reached
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedTopics.map(topic => (
              <Badge
                key={topic}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => handleRemoveTopic(topic)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRemoveTopic(topic);
                  }
                }}
              >
                {topic} <X className="w-3 h-3 ml-1" />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
} 