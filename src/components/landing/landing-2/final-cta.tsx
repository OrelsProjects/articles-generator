import { ChevronRight } from "lucide-react";

export const FinalCTA = () => {
  return (
    <section className="fixed bottom-0 left-0 right-0 bg-white shadow-lg border-t border-gray-200 p-4 backdrop-blur-lg bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Begin Your Creative Journey Today
            </h2>
            <p className="text-gray-600">
              Let AI-powered inspiration guide your writing to new heights.
            </p>
          </div>
          <button className="inline-flex items-center gap-x-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap group">
            <span>Start Writing</span>
            <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
          </button>
        </div>
      </div>
    </section>
  );
};
