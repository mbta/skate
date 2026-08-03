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

export const parsePaginatePayload = (
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
    const parsedData = create(normalizedPayload, array(SimpleDetourData))
    return { detours: parsedData.map(simpleDetourFromData) }
  }

  if (hasKey(normalizedPayload, "total_count")) {
    const parsedPagination = create(normalizedPayload, PaginatedDetoursData)
    return {
      detours: parsedPagination.data.map(simpleDetourFromData),
      pagination: {
        totalCount: parsedPagination.total_count,
        totalPages: parsedPagination.total_pages,
        pageNumber: parsedPagination.page_number,
        pageSize: parsedPagination.page_size,
      },
    }
  }

  if (hasKey(normalizedPayload, "data")) {
    const parsedData = create(normalizedPayload.data, array(SimpleDetourData))
    return { detours: parsedData.map(simpleDetourFromData) }
  }

  return { detours: [] }
}
