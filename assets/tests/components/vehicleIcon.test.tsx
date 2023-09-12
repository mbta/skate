import { test, expect } from "@jest/globals"
import React from "react"
import renderer from "react-test-renderer"
import VehicleIcon, {
  Orientation,
  Size,
  VehicleIconSvgNode,
} from "../../src/components/vehicleIcon"
import { AlertIconStyle } from "../../src/components/iconAlertCircle"
import { defaultUserSettings } from "../../src/userSettings"

test("renders in all directions and sizes", () => {
  const tree = renderer
    .create(
      <>
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Up}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Right}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Down}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Left}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Right}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Down}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Left}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Up}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Right}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Down}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Left}
          userSettings={defaultUserSettings}
        />
      </>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("renders with variants, labels, and alert icons", () => {
  const tree = renderer
    .create(
      <>
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Up}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Right}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Down}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Left}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Right}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Down}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Left}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Up}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Right}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Down}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Left}
          label="0617"
          variant="X"
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
      </>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("renders extended labels", () => {
  const tree = renderer
    .create(
      <>
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Up}
          label="Sw-Off"
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Up}
          label="Pull-B"
          userSettings={defaultUserSettings}
        />
      </>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("renders with all statuses", () => {
  const tree = renderer
    .create(
      <>
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"on-time"}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"early"}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"late"}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"off-course"}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"ghost"}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"plain"}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          userSettings={defaultUserSettings}
        />
      </>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("ghost with variant doesn't have eyes", () => {
  const tree = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Up}
        status={"ghost"}
        variant={"X"}
        userSettings={defaultUserSettings}
      />
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("ghost doesn't flip on its side", () => {
  const up = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Up}
        status={"ghost"}
        label={"ghost"}
        userSettings={defaultUserSettings}
      />
    )
    .toJSON()

  const left = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Left}
        status={"ghost"}
        label={"ghost"}
        userSettings={defaultUserSettings}
      />
    )
    .toJSON()

  const right = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Right}
        status={"ghost"}
        label={"ghost"}
        userSettings={defaultUserSettings}
      />
    )
    .toJSON()

  expect(up).toEqual(left)
  expect(up).toEqual(right)
})

test("ghost doesn't flip upside down", () => {
  const upNoLabel = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Up}
        status={"ghost"}
        userSettings={defaultUserSettings}
      />
    )
    .toJSON()

  const downNoLabel = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Down}
        status={"ghost"}
        userSettings={defaultUserSettings}
      />
    )
    .toJSON()

  expect(upNoLabel).toEqual(downNoLabel)
})

test("ghost going down puts label above it", () => {
  const ghostDownWithlabel = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Down}
        status={"ghost"}
        label={"ghost"}
        userSettings={defaultUserSettings}
      />
    )
    .toJSON()

  expect(ghostDownWithlabel).toMatchSnapshot()
})

test("renders ghost with alert icon", () => {
  const tree = renderer
    .create(
      <>
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Up}
          status={"ghost"}
          alertIconStyle={AlertIconStyle.Black}
          userSettings={defaultUserSettings}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Down}
          status={"ghost"}
          alertIconStyle={AlertIconStyle.Highlighted}
          userSettings={defaultUserSettings}
        />
      </>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})

test("renders an unwrapped svg node", () => {
  const tree = renderer
    .create(
      <svg>
        <VehicleIconSvgNode
          size={Size.Medium}
          orientation={Orientation.Down}
          label="label"
          userSettings={defaultUserSettings}
        />
      </svg>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
