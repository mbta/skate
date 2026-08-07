import React from "react"
import { Pagination } from "react-bootstrap"
import { PaginationItem } from "../../models/detoursPaginationData"


interface PaginationBarProps {
  pageNumber: number
  pageItems: PaginationItem[]
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
