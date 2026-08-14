export interface DetoursFilter {
  intersection?: string
  reason?: string
  updatedAt?: Date[]
}

export const serializeDetoursFilter = (
  filter: DetoursFilter
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {}

  if (filter.intersection !== undefined && filter.intersection !== "") {
    payload.intersection = filter.intersection
  }

  if (filter.reason !== undefined && filter.reason !== "all") {
    payload.reason = filter.reason
  }

  if (filter.updatedAt !== undefined && filter.updatedAt.length > 0) {
    payload.updated_at = filter.updatedAt.map((date) =>
      date.toISOString().slice(0, 10)
    )
  }

  return payload
}
