import { fetchRoutes } from "../src/api"

declare global {
  interface Window {
    /* eslint-disable typescript/no-explicit-any */
    fetch: (uri: string) => Promise<any>
  }
}

describe("fetchRoutes", () => {
  test("fetches a list of routes", done => {
    window.fetch = () =>
      Promise.resolve({
        json: () => ({
          data: [
            { id: "28" },
            { id: "39" },
            { id: "71" },
            { id: "73" },
            { id: "111" },
          ],
        }),
        ok: true,
        status: 200,
      })

    fetchRoutes().then(routes => {
      expect(routes).toEqual([
        { id: "28" },
        { id: "39" },
        { id: "71" },
        { id: "73" },
        { id: "111" },
      ])
      done()
    })
  })
})
