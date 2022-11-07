import appData from "../src/appData";
import inTestGroup from "../src/userTestGroups";

jest.mock("appData")

describe("User test groups helper", () => {
   // test("Assert")
   test("Assert detect user in group", () => {
      const group_1 = "user-test-group-1"
      const group_2 = "user-test-group-2"
      const mockSettings = {
         userTestGroups: JSON.stringify([
            group_1, group_2
         ])
      }
      ;(appData as jest.Mock)
         .mockImplementationOnce(() => {})
         .mockImplementation(() => mockSettings)

      // Start with no groups or keys
      expect(inTestGroup(group_1)).toBe(false)
      // Once groups are "loaded", check if in groups
      expect(inTestGroup(group_1)).toBe(true)
      expect(inTestGroup(group_2)).toBe(true)
   })
})
