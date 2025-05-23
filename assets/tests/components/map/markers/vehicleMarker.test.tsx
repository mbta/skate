import { describe, test, expect } from "@jest/globals"

import React, { PropsWithChildren } from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom/jest-globals"

import { VehicleMarker } from "../../../../src/components/map/markers/vehicleMarker"

import { shuttleFactory, vehicleFactory } from "../../../factories/vehicle"
import { MapContainer } from "react-leaflet"

const TestMap = ({ children }: PropsWithChildren): React.JSX.Element => (
  <MapContainer
    center={[0, 0]}
    zoom={13}
    maxBounds={[
      [41.2, -72],
      [43, -69.8],
    ]}
  >
    {children}
  </MapContainer>
)

describe("VehicleMarker", () => {
  test("Includes icon and label", () => {
    const { container } = render(
      <VehicleMarker
        vehicle={vehicleFactory.build({
          runId: "101",
        })}
        isPrimary={true}
      />,
      {
        wrapper: TestMap,
      }
    )
    expect(container.querySelector(".c-vehicle-map__icon")).toBeInTheDocument()
    expect(screen.getByText("101")).toBeInTheDocument()
  })

  describe.each([
    {
      forRunId: "999-0501",
      assertSpecialClass: ".c-vehicle-marker--blue",
    },
    {
      forRunId: "999-0502",
      assertSpecialClass: ".c-vehicle-marker--green",
    },
    {
      forRunId: "999-0503",
      assertSpecialClass: ".c-vehicle-marker--orange",
    },
    {
      forRunId: "999-0504",
      assertSpecialClass: ".c-vehicle-marker--red",
    },
    {
      forRunId: "999-0505",
      assertSpecialClass: ".c-vehicle-marker--cr",
    },
    {
      forRunId: "999-0555",
      assertSpecialClass: null,
    },
    {
      forRunId: "101",
      assertSpecialClass: null,
    },
  ])(
    "when vehicle is shuttle with runId:`$forRunId`",
    ({ forRunId, assertSpecialClass }) => {
      test("should render with shuttle class", () => {
        const { container } = render(
          <VehicleMarker
            vehicle={shuttleFactory.build({
              runId: forRunId,
            })}
            isPrimary={true}
          />,
          {
            wrapper: TestMap,
          }
        )

        expect(
          container.querySelector(".c-vehicle-marker--shuttle")
        ).toBeInTheDocument()
      })

      assertSpecialClass !== null &&
        test(`should render with class \`${assertSpecialClass}\``, () => {
          const { container } = render(
            <VehicleMarker
              vehicle={shuttleFactory.build({
                runId: forRunId,
              })}
              isPrimary={true}
            />,
            {
              wrapper: TestMap,
            }
          )

          expect(
            container.querySelector(assertSpecialClass)
          ).toBeInTheDocument()
        })
    }
  )
})
