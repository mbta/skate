import React from "react"
import { Pagination } from "react-bootstrap"

export const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const clampedCurrent = Math.min(Math.max(currentPage, 1), totalPages)
  const pages = new Set<number>([1, totalPages])

  // Show the page numbers before and after the current page.
  for (let page = clampedCurrent - 1; page <= clampedCurrent + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page)
    }
  }

  const orderedPages = Array.from(pages).sort((a, b) => a - b)
  const items: Array<number | "ellipsis"> = []

  // Add ellipses if there are gaps between page numbers.
  orderedPages.forEach((page, index) => {
    if (index > 0) {
      const previousPage = orderedPages[index - 1]
      if (page - previousPage > 1) {
        items.push("ellipsis")
      }
    }
    items.push(page)
  })

  return items
}

interface PaginationBarProps {
  pageNumber: number
  pageItems: Array<number | "ellipsis">
  canGoNext: boolean
  onPrevious: () => void
  onNext: () => void
  onSelectPage: (page: number) => void
}

export const PaginationBar = ({
  pageNumber,
  pageItems,
  canGoNext,
  onPrevious,
  onNext,
  onSelectPage,
}: PaginationBarProps) => {
  return (
    <div className="d-flex justify-content-end mb-4">
      <Pagination className="mb-0">
        <Pagination.Prev
          disabled={pageNumber <= 1}
          aria-disabled={pageNumber <= 1}
          aria-label="Previous"
          onClick={onPrevious}
        />
        {pageItems.map((page, index) =>
          typeof page === "number" ? (
            <Pagination.Item
              key={page}
              active={pageNumber === page}
              onClick={() => onSelectPage(page)}
            >
              {page}
            </Pagination.Item>
          ) : (
            <Pagination.Ellipsis key={`${page}-${index}`} disabled />
          )
        )}
        <Pagination.Next
          disabled={!canGoNext}
          aria-disabled={!canGoNext}
          aria-label="Next"
          onClick={onNext}
        />
      </Pagination>
    </div>
  )
}
