import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchWriter } from "@/lib/hooks/useSearchWriter";
import { Input } from "@/components/ui/input";
import { User, Loader2, ExternalLink } from "lucide-react";
import { WriterSearchResult } from "@/types/writer";
import { debounce } from "lodash";

export function WriterSearchBar() {
  const [query, setQuery] = useState("");
  const { result, search, loading } = useSearchWriter();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef(search);
  searchRef.current = search;

  // Create a single debounced function, also in a ref:
  const debouncedSearch = useRef(
    debounce((value: string) => {
      // Always call the newest `search` function reference
      searchRef.current(value);
    }, 300),
  ).current;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectWriter = (writer: WriterSearchResult) => {
    window.open(`/writer/${writer.handle}`, "_blank");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div className="relative">
        <Input
          placeholder="Search writer..."
          className="pl-8 pr-4 h-10 border-none shadow-none focus-visible:ring-0"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            debouncedSearch(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          maxLength={120}
        />
        <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
          <User className="h-4 w-4" />
        </div>
      </div>

      {isOpen && (query || loading) && (
        <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          ) : result.length > 0 ? (
            <div className="py-1">
              {result.map((writer, index) => (
                <button
                  key={writer.id}
                  className="w-full px-4 py-2 text-left hover:bg-accent flex items-center gap-3"
                  onClick={() => handleSelectWriter(writer)}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(-1)}
                >
                  <img
                    src={writer.photoUrl}
                    alt={writer.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{writer.name}</span>
                    <span className="text-xs text-muted-foreground">
                      @{writer.handle}
                    </span>
                  </div>
                  {index === hoveredIndex && (
                    <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="px-4 py-2 text-sm text-muted-foreground">
              No writers found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
