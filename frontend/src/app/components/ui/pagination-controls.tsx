import { Button } from "./button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
}

export function PaginationControls({ 
  currentPage, 
  lastPage, 
  total, 
  onPageChange,
  isLoading = false 
}: PaginationProps) {
  if (lastPage <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(lastPage, startPage + maxVisiblePages - 1);
  
  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-8 px-2">
      <div className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
        Showing Page <span className="text-gray-900">{currentPage}</span> of <span className="text-gray-900">{lastPage}</span> — {total} Records Total
      </div>
      
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-gray-100 rounded-xl hover:bg-orange-50 hover:text-[#FF7F11]"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronsLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-gray-100 rounded-xl hover:bg-orange-50 hover:text-[#FF7F11]"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {pages.map(page => (
            <Button
              key={page}
              variant={currentPage === page ? "default" : "outline"}
              className={`h-9 w-9 rounded-xl font-bold text-xs transition-all ${
                currentPage === page 
                  ? "bg-[#FF7F11] hover:bg-orange-600 shadow-md shadow-orange-100" 
                  : "border-gray-100 hover:bg-orange-50 hover:text-[#FF7F11]"
              }`}
              onClick={() => onPageChange(page)}
              disabled={isLoading}
            >
              {page}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-gray-100 rounded-xl hover:bg-orange-50 hover:text-[#FF7F11]"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage || isLoading}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 border-gray-100 rounded-xl hover:bg-orange-50 hover:text-[#FF7F11]"
          onClick={() => onPageChange(lastPage)}
          disabled={currentPage === lastPage || isLoading}
        >
          <ChevronsRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
