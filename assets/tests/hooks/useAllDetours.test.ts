import { jest, describe, test, expect, beforeEach } from "@jest/globals"
import { renderHook, waitFor } from "@testing-library/react"
import { fetchDetours } from "../../src/api"
import { useAllDetours } from "../../src/hooks/useAllDetours"
import { Ok } from "../../src/util/result"

jest.mock("../../src/api")

beforeEach(() => {
  jest.mocked(fetchDetours).mockReturnValue(new Promise(() => {}))
})

describe("useAllDetours", () => {
  test("returns detours", async () => {
    const detours = {
      active: [
        {
          route: "1",
          direction: "Inbound",
          name: "Headsign A",
          intersection: "Street A & Avenue B",
          updated_at: 1724866392,
        },
        {
          route: "2",
          direction: "Outbound",
          name: "Headsign B",
          intersection: "Street C & Avenue D",
          updated_at: 1724856392,
        },
      ],
      draft: null,
      past: [
        {
          route: "1",
          direction: "Inbound",
          name: "Headsign A",
          intersection: "Street E & Avenue F",
          updated_at: 1724866392,
        },
        {
          route: "1",
          direction: "Outbound",
          name: "Headsign Z",
          intersection: "Street C & Avenue D",
          updated_at: 1724866392,
        },
      ],
    }

    jest.mocked(fetchDetours).mockResolvedValue(Ok(detours))

    const { result } = renderHook(() => {
      return useAllDetours()
    })

    expect(jest.mocked(fetchDetours)).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(result.current).toEqual(detours))
  })

  test("returns null when data not fetched", () => {
    const { result } = renderHook(() => {
      return useAllDetours()
    })

    expect(result.current).toEqual(null)
  })
})
