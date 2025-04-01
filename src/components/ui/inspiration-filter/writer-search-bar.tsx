import { useState, useRef, useEffect, useCallback } from "react";
import { useSearchWriter } from "@/lib/hooks/useSearchWriter";
import { Input } from "@/components/ui/input";
import { User, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { WriterSearchResult } from "@/types/writer";
import { debounce } from "lodash";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import slugify from "slugify";
// WriterSkeleton component for loading states
const WriterSkeleton = () => (
  <div className="w-full p-4 rounded-md border border-border flex items-start gap-3">
    <Skeleton className="w-12 h-12 rounded-full" />
    <div className="flex flex-col space-y-2 flex-1">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-4 w-full" />
    </div>
  </div>
);

export function WriterSearchBar() {
  const {
    result,
    search,
    loading,
    loadMore,
    hasMore,
    updateQuery,
    query,
    loadingMore,
  } = useSearchWriter();

  const [isOpen, setIsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);
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

  const handleScroll = useCallback(() => {
    if (!dialogContentRef.current || !loadMore || loadingMore) return;

    const { scrollTop, scrollHeight, clientHeight } = dialogContentRef.current;
    const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;

    if (scrollPercentage > 70) {
      console.log("About to load more");
      loadMore();
    }
  }, [loadMore, loadingMore]);

  useEffect(() => {
    const currentRef = dialogContentRef.current;
    if (dialogOpen && currentRef) {
      currentRef.addEventListener("scroll", handleScroll);
    }

    return () => {
      if (currentRef) {
        currentRef.removeEventListener("scroll", handleScroll);
      }
    };
  }, [dialogOpen, handleScroll]);

  const handleSelectWriter = (writer: WriterSearchResult) => {
    let url = `/writer/${writer.handle}`;
    if (writer.name) {
      url += `/${slugify(writer.name)}`;
    }
    window.open(url, "_blank");
  };

  const formatName = (name: string) => {
    // Make the query black and the rest semibold
    if (!query.trim()) return name;
    const regex = new RegExp(`(${query})`, "gi");
    return name.replace(regex, "<span class='font-extrabold'>$1</span>");
  };

  const formatBio = (bio?: string | null) => {
    if (!bio) return "";
    if (!query.trim()) return bio;
    const regex = new RegExp(`(${query})`, "gi");
    const start = bio.toLowerCase().indexOf(query.toLowerCase());
    if (start === -1) return bio;
    // Make sure the bio has actually more than 20. otherwise, just return the bio.
    const startIndex = Math.max(0, start - 20);
    let croppedBio = bio.slice(startIndex, bio.length);
    if (bio.length < 20) {
      croppedBio = bio;
    }
    return croppedBio.replace(regex, "<span class='font-extrabold'>$1</span>");
  };

  const openShowAllDialog = () => {
    setDialogOpen(true);
    // Force a new search if needed
    if (result.length === 0 && !loading) {
      searchRef.current(query);
    }
  };

  return (
    <>
      <div className="relative w-full" ref={dropdownRef}>
        <div className="relative flex items-center">
          <Input
            placeholder="Search writer..."
            className="pl-8 pr-4 h-10 border-none shadow-none focus-visible:ring-0"
            value={query}
            onChange={e => {
              updateQuery(e.target.value);
              debouncedSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            maxLength={120}
          />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
            <User className="h-4 w-4" />
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={openShowAllDialog}
          >
            Show all
          </Button>
        </div>

        {isOpen && (query || loading) && (
          <div className="absolute z-50 w-full mt-1 bg-card border rounded-md shadow-lg max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            ) : result.length > 0 ? (
              <div className="py-1">
                {result.slice(0, 5).map((writer, index) => (
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
                      <span
                        className="text-sm"
                        dangerouslySetInnerHTML={{
                          __html: formatName(writer.name),
                        }}
                      />

                      <span
                        className="text-xs text-muted-foreground line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: formatBio(writer.bio) || `@${writer.handle}`,
                        }}
                      />
                    </div>
                    {index === hoveredIndex && (
                      <ExternalLink className="w-4 h-4 text-muted-foreground ml-auto" />
                    )}
                  </button>
                ))}
                {result.length > 5 && (
                  <div className="px-4 py-2 text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs w-full text-muted-foreground hover:text-foreground"
                      onClick={openShowAllDialog}
                      disabled={loading || !query}
                    >
                      Show all {result.length} writers
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                No writers found
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[550px] md:max-w-[700px] lg:max-w-[900px] max-h-[80vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <div className="relative mt-4">
              <Input
                placeholder="Search writer..."
                className="pl-8 pr-4 h-10"
                value={query}
                onChange={e => {
                  updateQuery(e.target.value);
                  debouncedSearch(e.target.value);
                }}
                maxLength={120}
              />
              <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
                <User className="h-4 w-4" />
              </div>
            </div>
          </DialogHeader>

          <div
            ref={dialogContentRef}
            className="overflow-y-auto px-6 py-4 max-h-[calc(80vh-140px)]"
            onScroll={handleScroll}
          >
            {loading && result.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(9)].map((_, index) => (
                  <WriterSkeleton key={index} />
                ))}
              </div>
            ) : result.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {result.map(writer => (
                  <button
                    key={writer.id}
                    className={cn(
                      "w-full p-4 text-left rounded-md hover:bg-accent flex items-start gap-3",
                      "border border-border transition-colors",
                    )}
                    onClick={() => handleSelectWriter(writer)}
                  >
                    <img
                      src={writer.photoUrl}
                      alt={writer.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex flex-col">
                      <span
                        className="text-base font-medium"
                        dangerouslySetInnerHTML={{
                          __html: formatName(writer.name),
                        }}
                      />
                      <span className="text-sm text-muted-foreground">
                        @{writer.handle}
                      </span>
                      <span
                        className="text-sm text-muted-foreground mt-1 line-clamp-2"
                        dangerouslySetInnerHTML={{
                          __html: formatBio(writer.bio) || "",
                        }}
                      />
                    </div>
                  </button>
                ))}

                {loadingMore &&
                  [...Array(5)].map((_, index) => (
                    <WriterSkeleton key={index} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No writers found
              </div>
            )}

            {!hasMore && result.length > 0 && !loading && !loadingMore && (
              <div className="flex flex-col items-center justify-center py-8 text-muted-foreground text-sm">
                <CheckCircle2 className="h-5 w-5 mb-2 text-primary/70" />
                <p>You&apos;ve reached the end of the list</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
