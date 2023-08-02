import {
  defaultFallbackString,
  formatOperatorName,
  formatOperatorNameFromVehicle,
} from "../../src/util/operatorFormatting"
import vehicleFactory from "../factories/vehicle"

describe("formatOperatorName", () => {
  test("when given non-null data, should return formatted operator name", () => {
    const first = "FirstName"
    const last = "LastName"
    const id = "123456789"
    expect(formatOperatorName(first, last, id)).toBe(`${first} ${last} #${id}`)
  })

  test("when given null first name, should return formatted operator name without that field", () => {
    const first = null
    const last = "LastName"
    const id = "123456789"
    expect(formatOperatorName(first, last, id)).toBe(`${last} #${id}`)
  })

  test("when given null last name, should return formatted operator name without that field", () => {
    const first = "FirstName"
    const last = null
    const id = "123456789"
    expect(formatOperatorName(first, last, id)).toBe(`${first} #${id}`)
  })

  test("when given null id, should return formatted operator name without that field", () => {
    const first = "FirstName"
    const last = "LastName"
    const id = null
    expect(formatOperatorName(first, last, id)).toBe(`${first} ${last}`)
  })

  test("when given null id, should return formatted operator name without that field", () => {
    const first = "FirstName"
    const last = "LastName"
    const id = null
    expect(formatOperatorName(first, last, id)).toBe(`${first} ${last}`)
  })

  test("when all inputs are null and there is no fallback parameter, should return default fallback string", () => {
    expect(formatOperatorName(null, null, null)).toBe(defaultFallbackString)
  })

  test("when all inputs are null and there is a fallback parameter, should return fallback parameter", () => {
    const fallbackText = "FallbackText"
    expect(formatOperatorName(null, null, null, { fallbackText })).toBe(
      fallbackText
    )
  })
})

describe("formatOperatorNameFromVehicle", () => {
  test("when given vehicle with all operator info, should return formatted string", () => {
    const vehicle = vehicleFactory.build()
    const { operatorFirstName, operatorLastName, operatorId } = vehicle
    expect(formatOperatorNameFromVehicle(vehicle)).toBe(
      `${operatorFirstName} ${operatorLastName} #${operatorId}`
    )
  })

  test("when given vehicle with null operator id, should return formatted string", () => {
    const vehicle = vehicleFactory.build({ operatorId: null })
    const { operatorFirstName, operatorLastName } = vehicle
    expect(formatOperatorNameFromVehicle(vehicle)).toBe(
      `${operatorFirstName} ${operatorLastName}`
    )
  })

  test("when given vehicle with null first name, should return formatted string", () => {
    const vehicle = vehicleFactory.build({ operatorFirstName: null })
    const { operatorLastName, operatorId } = vehicle
    expect(formatOperatorNameFromVehicle(vehicle)).toBe(
      `${operatorLastName} #${operatorId}`
    )
  })

  test("when given vehicle with all null operator data, should return default fallback text", () => {
    const vehicle = vehicleFactory.build({
      operatorFirstName: null,
      operatorLastName: null,
      operatorId: null,
    })
    expect(formatOperatorNameFromVehicle(vehicle)).toBe(defaultFallbackString)
  })

  test("when given vehicle with all null operator data and fallback parameter, should return fallback parameter", () => {
    const fallbackText = "FallbackText"
    const vehicle = vehicleFactory.build({
      operatorFirstName: null,
      operatorLastName: null,
      operatorId: null,
    })
    expect(formatOperatorNameFromVehicle(vehicle, { fallbackText })).toBe(
      fallbackText
    )
  })
})
