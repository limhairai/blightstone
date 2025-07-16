import React from 'react'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  showInfo?: boolean
  total?: number
  limit?: number
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  showInfo = true,
  total = 0,
  limit = 20
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages = []
    const showPages = 7 // Show 7 page numbers max
    
    if (totalPages <= showPages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show smart pagination
      if (currentPage <= 4) {
        // Show first 5 pages + ... + last page
        for (let i = 1; i <= 5; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 3) {
        // Show first page + ... + last 5 pages
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i)
        }
      } else {
        // Show first + ... + current-1, current, current+1 + ... + last
        pages.push(1)
        pages.push('...')
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i)
        }
        pages.push('...')
        pages.push(totalPages)
      }
    }
    
    return pages
  }

  if (totalPages <= 1) return null

  const startItem = (currentPage - 1) * limit + 1
  const endItem = Math.min(currentPage * limit, total)

  return (
    <div className="flex items-center justify-between px-2 py-4">
      {showInfo && (
        <div className="text-sm text-muted-foreground">
          Showing {startItem} to {endItem} of {total} results
        </div>
      )}
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((page, index) => (
            <React.Fragment key={index}>
              {page === '...' ? (
                <Button variant="ghost" size="sm" disabled>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(page as number)}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              )}
            </React.Fragment>
          ))}
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

// Hook for managing pagination state
export function usePagination(initialPage = 1, initialLimit = 20) {
  const [page, setPage] = React.useState(initialPage)
  const [limit, setLimit] = React.useState(initialLimit)
  
  const resetPage = () => setPage(1)
  
  return {
    page,
    limit,
    setPage,
    setLimit,
    resetPage
  }
} 