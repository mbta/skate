import React from "react"
import renderer from "react-test-renderer"
import VehicleIcon, {
  Orientation,
  Size,
  VehicleIconSvgNode,
} from "../../src/components/vehicleIcon"
import { AlertIconStyle } from "../../src/components/iconAlertCircle"

test("renders in all directions and sizes", () => {
  const tree = renderer
    .create(
      <>
        <VehicleIcon size={Size.Small} orientation={Orientation.Up} />
        <VehicleIcon size={Size.Small} orientation={Orientation.Right} />
        <VehicleIcon size={Size.Small} orientation={Orientation.Down} />
        <VehicleIcon size={Size.Small} orientation={Orientation.Left} />
        <VehicleIcon size={Size.Medium} orientation={Orientation.Up} />
        <VehicleIcon size={Size.Medium} orientation={Orientation.Right} />
        <VehicleIcon size={Size.Medium} orientation={Orientation.Down} />
        <VehicleIcon size={Size.Medium} orientation={Orientation.Left} />
        <VehicleIcon size={Size.Large} orientation={Orientation.Up} />
        <VehicleIcon size={Size.Large} orientation={Orientation.Right} />
        <VehicleIcon size={Size.Large} orientation={Orientation.Down} />
        <VehicleIcon size={Size.Large} orientation={Orientation.Left} />
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
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Right}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Down}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Small}
          orientation={Orientation.Left}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Right}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Down}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Left}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Up}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Right}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Down}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Left}
          label="0617"
          variant="X"
          alertIcon={AlertIconStyle.Black}
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
          label="SW-OFF"
        />
        <VehicleIcon
          size={Size.Large}
          orientation={Orientation.Up}
          label="PULL-B"
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
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"early"}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"late"}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"off-course"}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"ghost"}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Up}
          status={"plain"}
        />
        <VehicleIcon size={Size.Medium} orientation={Orientation.Up} />
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
      />
    )
    .toJSON()

  const downNoLabel = renderer
    .create(
      <VehicleIcon
        size={Size.Medium}
        orientation={Orientation.Down}
        status={"ghost"}
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
          alertIcon={AlertIconStyle.Black}
        />
        <VehicleIcon
          size={Size.Medium}
          orientation={Orientation.Down}
          status={"ghost"}
          alertIcon={AlertIconStyle.Highlighted}
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
        />
      </svg>
    )
    .toJSON()

  expect(tree).toMatchSnapshot()
})
