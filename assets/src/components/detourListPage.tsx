import React, { useContext, useEffect, useState } from "react"
import { DetoursTable, DetourStatus } from "./detoursTable"
import userInTestGroup, { TestGroups } from "../userInTestGroup"
import { Button, Pagination, Spinner } from "react-bootstrap"
import {
  GlobeAmericas,
  LockFill,
  PeopleFill,
  PlusSquare,
} from "../helpers/bsIcons"
import type { SvgProps } from "../helpers/bsIcons"
import RoutesContext from "../contexts/routesContext"
import { DetourModal } from "./detours/detourModal"
import { joinClasses } from "../helpers/dom"
import { useLoadDetour } from "../hooks/useLoadDetour"
import {
  type DetoursPagination,
  useActiveDetours,
  useDraftDetours,
  usePastDetours,
} from "../hooks/useDetours"
import { SocketContext } from "../contexts/socketContext"

// Determine page numbers in the pagination component, with ellipses if there are too many pages to show
export const buildPaginationItems = (
  currentPage: number,
  totalPages: number
): Array<number | "ellipsis"> => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1)
  }

  const clampedCurrent = Math.min(Math.max(currentPage, 1), totalPages)
  const pages = new Set<number>([1, totalPages])

  // Show the page numbers before and after the current page
  for (let page = clampedCurrent - 1; page <= clampedCurrent + 1; page += 1) {
    if (page > 1 && page < totalPages) {
      pages.add(page)
    }
  }

  const orderedPages = Array.from(pages).sort((a, b) => a - b)
  const items: Array<number | "ellipsis"> = []

  // Add ellipses if there are gaps between the page numbers
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

export const DetourListPage = () => {
  const routes = useContext(RoutesContext)
  const [showDetourModalProps, setShowDetourModalProps] = useState<{
    show: boolean
    fromCopy: boolean
  }>({ show: false, fromCopy: false })
  const [detourId, setDetourId] = useState<number | undefined>()

  const { show: showDetourModal, fromCopy: showFromCopy } = showDetourModalProps
  const [routeId, setRouteId] = useState<string>("all")

  // Wait for the detour channels to initialize
  const { socket } = useContext(SocketContext)
  const [pageNumber, setPageNumber] = useState(1)
  const [detoursPagination, setDetoursPagination] = useState<
    DetoursPagination | undefined
  >()
  const currentLimit = 3

  // For pagination, reset the page number to 1 when the routeId changes
  useEffect(() => {
    setPageNumber(1)
    setDetoursPagination(undefined)
  }, [routeId])

  const activeDetoursMap = useActiveDetours(socket)
  const draftDetoursMap = useDraftDetours(socket)
  const pastDetoursMap = usePastDetours({
    socket: socket,
    routeId: routeId,
    limit: currentLimit,
    pageNumber,
    onPaginate: setDetoursPagination,
  })

  const activeDetours =
    activeDetoursMap &&
    Object.values(activeDetoursMap).sort((a, b) => b.updatedAt - a.updatedAt)
  const draftDetours =
    draftDetoursMap &&
    Object.values(draftDetoursMap).sort((a, b) => b.updatedAt - a.updatedAt)
  const pastDetours =
    pastDetoursMap &&
    Object.values(pastDetoursMap).sort((a, b) => b.updatedAt - a.updatedAt)

  const totalPages = detoursPagination?.totalPages
  const pageItems =
    totalPages !== undefined
      ? buildPaginationItems(pageNumber, totalPages)
      : [pageNumber]
  const canGoNext =
    totalPages !== undefined
      ? pageNumber < totalPages
      : Boolean(pastDetours && pastDetours.length >= currentLimit)
  // --- End of detour channel initialization

  const { detour, isLoading: isLoadingDetour } = useLoadDetour(detourId)

  const setShowDetourModal = (show: boolean) => {
    setShowDetourModalProps({ show: show, fromCopy: false })
  }

  const onOpenDetour = (detourId: number, props = { fromCopy: false }) => {
    setDetourId(detourId)
    setShowDetourModalProps({ show: true, ...props })
  }

  const onCloseDetour = () => {
    setDetourId(undefined)
    setShowDetourModal(false)
  }

  return (
    <div className="c-detour-list-page h-100 overflow-y-auto p-0 p-md-4 bg-white">
      {userInTestGroup(TestGroups.DetoursPilot) && (
        <Button
          className="c-detour-list-page__button icon-link fw-light px-3 py-2 u-hide-for-mobile"
          onClick={() => setShowDetourModal(true)}
          data-fs-element="Add Detour"
        >
          <PlusSquare />
          <span className="c-detour-list-page__button-text">Add detour</span>
        </Button>
      )}
      {activeDetours && draftDetours && pastDetours ? (
        <>
          <DetoursTable
            data={activeDetours}
            status={DetourStatus.Active}
            onOpenDetour={onOpenDetour}
            classNames={["mb-5"]}
            title={
              <Title
                title="Active detours"
                icon={GlobeAmericas}
                visibility="All Skate users"
                classNames={["d-flex"]}
              />
            }
          />
          {/* options
            1. move title into DetourTable
            2. add Button here, onClick={clearDetour} ... requires value exposed ... 
          */}
          {userInTestGroup(TestGroups.DetoursPilot) && (
            <>
              <DetoursTable
                data={draftDetours}
                status={DetourStatus.Draft}
                onOpenDetour={onOpenDetour}
                title={
                  <Title
                    title="Draft detours"
                    icon={LockFill}
                    visibility="Only you"
                    classNames={["u-hide-for-mobile", "d-md-flex"]}
                  />
                }
                classNames={["mb-5", "u-hide-for-mobile"]}
              />
              <DetoursTable
                data={pastDetours}
                status={DetourStatus.Closed}
                onOpenDetour={onOpenDetour}
                title={
                  <Title
                    title="Closed detours"
                    icon={PeopleFill}
                    visibility="Dispatchers and supervisors"
                    classNames={["u-hide-for-mobile", "d-md-flex"]}
                  />
                }
                routeId={routeId}
                setRouteId={setRouteId}
                routes={routes}
                classNames={["u-hide-for-mobile"]}
              />
              <div className="d-flex justify-content-end mb-4">
                <Pagination className="mb-0">
                  <Pagination.Prev
                    disabled={pageNumber <= 1}
                    aria-label="Previous"
                    onClick={() => setPageNumber((page) => Math.max(1, page - 1))}
                  />
                  {pageItems.map((page, index) =>
                    typeof page === "number" ? (
                      <Pagination.Item
                        key={page}
                        active={pageNumber === page}
                        onClick={() => setPageNumber(page)}
                      >
                        {page}
                      </Pagination.Item>
                    ) : (
                      <Pagination.Ellipsis key={`${page}-${index}`} disabled />
                    )
                  )}
                  <Pagination.Next
                    disabled={!canGoNext}
                    aria-label="Next"
                    onClick={() => setPageNumber((page) => page + 1)}
                  />
                </Pagination>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="position-absolute inset-0 opacity-75 d-flex justify-content-center align-items-center">
          <Spinner />
        </div>
      )}

      {/* `detourId` exists before `stateOfDetourModal` does, so need this conditional
       * to ensure that either there's no `detourId` selected (i.e. make a new detour)
       * or the state has been successfully fetched from the api
       */}
      {showDetourModal && (!detourId || detour) && (
        <DetourModal
          onClose={onCloseDetour}
          onOpenDetour={onOpenDetour}
          show
          key={detourId ?? ""}
          isLoadingDetour={isLoadingDetour}
          showFromCopy={showFromCopy}
          {...(detour
            ? {
                snapshot: detour.state,
                author: detour.author,
                updatedAt: detour.updatedAt,
              }
            : { originalRoute: {} })}
        />
      )}
    </div>
  )
}

const Title = (args: {
  title: string
  icon: (props: SvgProps) => React.JSX.Element
  visibility: string
  classNames?: string[]
}) => (
  <div
    className={joinClasses([
      ...(args.classNames || []),
      "mt-3",
      "mt-md-0",
      "mb-3",
      "mx-3",
      "mx-md-0",
    ])}
  >
    <h2 className="my-auto fw-semibold fs-1 me-3 text-nowrap">{args.title}</h2>
    <args.icon className="c-detour-list-page__header-icon my-auto me-1" />
    <span className="c-detour-list-page__header-visibility my-auto">
      {args.visibility}
    </span>
  </div>
)
