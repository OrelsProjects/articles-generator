"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TopicsSearchInputProps {
  selectedTopics: string[];
  onTopicsChange: (topics: string[]) => void;
  placeholder?: string;
  label?: string;
  maxTopics?: number;
  popularTopics?: string[];
  isLoadingPopularTopics?: boolean;
}

export default function TopicsSearchInput({
  selectedTopics,
  onTopicsChange,
  placeholder = "Search topics...",
  label = "Topics",
  maxTopics = 9999,
  popularTopics = [],
  isLoadingPopularTopics = false,
}: TopicsSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
          `/api/v1/topics/search?q=${encodeURIComponent(query)}&limit=10`,
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
    [],
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
      selectedTopics.length < (maxTopics || 10)
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
    } else if (
      e.key === "Backspace" &&
      !searchQuery.trim() &&
      selectedTopics.length > 0
    ) {
      e.preventDefault();
      const lastTopic = selectedTopics[selectedTopics.length - 1];
      handleRemoveTopic(lastTopic);
    }
  };

  const filteredResults = searchResults.filter(
    topic => !selectedTopics.includes(topic),
  );

  const filteredPopularTopics = popularTopics.filter(
    topic => !selectedTopics.includes(topic),
  );

  // Animation variants for topics
  const topicVariants = {
    initial: {
      opacity: 0,
      scale: 0.8,
      x: -10,
    },
    animate: {
      opacity: 1,
      scale: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
        mass: 1,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      x: 10,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
  };

  const clearButtonVariants = {
    initial: { opacity: 0, scale: 0.8 },
    animate: { 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      transition: {
        duration: 0.15,
      },
    },
  };

  const topPickVariants = {
    initial: { opacity: 0, scale: 0.9, y: 10 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0.9, 
      y: -10,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeOut",
      },
    },
    tap: {
      scale: 0.95,
      transition: {
        duration: 0.1,
        ease: "easeInOut",
      },
    },
  };

  const containerVariants = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <div className="space-y-4">
      {label && <Label>{label}</Label>}

      <div className="relative">
        <div className="relative">
          <div className="min-h-[40px] w-full flex rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <div
              className="flex flex-wrap gap-1 items-center"
              onClick={() => inputRef.current?.focus()}
            >
              {/* Selected Topics as chips inside input */}
              <AnimatePresence>
                {selectedTopics.map(topic => (
                  <motion.span
                    key={topic}
                    variants={topicVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    layout
                  >
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 py-1 px-2 text-xs rounded-full"
                    >
                      {topic}
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          handleRemoveTopic(topic);
                        }}
                        className="hover:bg-secondary-foreground/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  </motion.span>
                ))}
              </AnimatePresence>

              {/* Input field */}
              <input
                ref={inputRef}
                value={searchQuery}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                onKeyDown={handleKeyDown}
                placeholder={selectedTopics.length === 0 ? placeholder : ""}
                className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground"
                disabled={selectedTopics.length >= maxTopics}
              />
            </div>
            {/* Clear all button */}
            <AnimatePresence>
              {selectedTopics.length > 0 && (
                <motion.div
                  variants={clearButtonVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="my-auto"
                >
                  <Button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      onTopicsChange([]);
                      setSearchQuery("");
                    }}
                    variant="ghost"
                    title="Clear all topics"
                    className="p-2.5 rounded-full"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {searchQuery.trim() && (
            <Button
              type="button"
              onClick={handleAddCustomTopic}
              disabled={selectedTopics.length >= maxTopics}
              size="sm"
              className="absolute right-2 top-1/2 -translate-y-1/2"
            >
              Add
            </Button>
          )}
        </div>

        {/* Search Results Dropdown */}
        {showResults && (searchQuery.trim() || isSearching) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
            {isSearching && filteredResults.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
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

      {/* Top Picks Section */}
      {(filteredPopularTopics.length > 0 || isLoadingPopularTopics) && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">
            Top Picks
          </h3>
          {isLoadingPopularTopics ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading suggestions...
            </div>
          ) : (
            <motion.div
              className="flex flex-wrap gap-2"
              variants={containerVariants}
              initial="initial"
              animate="animate"
            >
              {filteredPopularTopics.map(topic => (
                <motion.div
                  key={topic}
                  variants={topPickVariants}
                  whileHover="hover"
                  whileTap="tap"
                  className="cursor-pointer"
                  onClick={() => handleAddTopic(topic)}
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAddTopic(topic);
                    }
                  }}
                >
                  <Badge
                    variant="outline"
                    className="border-primary/20 text-primary bg-primary/5 rounded-full text-md px-4"
                  >
                    {topic}
                  </Badge>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      )}

      {/* Topic count indicator */}
      {selectedTopics.length > 0 && maxTopics !== 9999 && (
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {selectedTopics.length}/{maxTopics} topics selected
          </span>
          {selectedTopics.length >= maxTopics && <span>Maximum reached</span>}
        </div>
      )}
    </div>
  );
}

// Debounce utility function
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}
