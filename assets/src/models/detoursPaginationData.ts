import { array, create, number, object } from "superstruct"
import {
  SimpleDetour,
  SimpleDetourData,
  simpleDetourFromData,
} from "./detoursList"

export interface DetoursPagination {
  totalCount: number
  totalPages: number
  pageNumber: number
  pageSize: number
}

const PaginatedDetoursData = object({
  data: array(SimpleDetourData),
  total_count: number(),
  total_pages: number(),
  page_number: number(),
  page_size: number(),
})

const hasKey = <K extends string>(
  payload: unknown,
  key: K
): payload is Record<K, unknown> => {
  return typeof payload === "object" && payload !== null && key in payload
}

export const parsePaginationPayload = (
  payload: unknown
): {
  detours: SimpleDetour[]
  pagination?: DetoursPagination
} => {
  const normalizedPayload =
    hasKey(payload, "data") && hasKey(payload.data, "total_count")
      ? payload.data
      : payload

  if (Array.isArray(normalizedPayload)) {
    const simpleDetourData = create(normalizedPayload, array(SimpleDetourData))
    return { detours: simpleDetourData.map(simpleDetourFromData) }
  }

  if (hasKey(normalizedPayload, "total_count")) {
    const paginatedDetoursData = create(normalizedPayload, PaginatedDetoursData)
    return {
      detours: paginatedDetoursData.data.map(simpleDetourFromData),
      pagination: {
        totalCount: paginatedDetoursData.total_count,
        totalPages: paginatedDetoursData.total_pages,
        pageNumber: paginatedDetoursData.page_number,
        pageSize: paginatedDetoursData.page_size,
      },
    }
  }

  if (hasKey(normalizedPayload, "data")) {
    const simpleDetourData = create(
      normalizedPayload.data,
      array(SimpleDetourData)
    )
    return { detours: simpleDetourData.map(simpleDetourFromData) }
  }

  return { detours: [] }
}
