import React, { ComponentProps } from "react"
import { Table } from "react-bootstrap"
import { RoutePill } from "./routePill"
import { useCurrentTimeSeconds } from "../hooks/useCurrentTime"
import { timeAgoLabel } from "../util/dateTime"
import { SimpleDetour } from "../models/detour"

interface DetoursTableProps {
  data: SimpleDetour[] | null
  status: DetourStatus
}

export enum DetourStatus {
  Draft = "draft",
  Active = "active",
  Closed = "closed",
}

export const timestampLabelFromStatus = (status: DetourStatus) => {
  switch (status) {
    case DetourStatus.Draft:
      return "Last edited"
    case DetourStatus.Active:
      return "On detour since"
    case DetourStatus.Closed:
      return "Last used"
    default:
      throw "Invalid detour status"
  }
}

export const DetoursTable = ({ data, status }: DetoursTableProps) => (
  <Table hover={data !== null} className="c-detours-table">
    <thead className="u-hide-for-mobile">
      <tr>
        <th className="px-3 py-4">Route and direction</th>
        <th className="px-3 py-4 u-hide-for-mobile">Starting Intersection</th>
        <th className="px-3 py-4 u-hide-for-mobile">
          {timestampLabelFromStatus(status)}
        </th>
      </tr>
    </thead>
    <tbody>
      <DetourRows data={data} status={status} />
    </tbody>
  </Table>
)

const DetourRows = ({
  data,
  status,
}: {
  data: SimpleDetour[] | null
  status: DetourStatus
}) =>
  data === null ? (
    <EmptyDetourRows message={`No ${status} detours.`} />
  ) : (
    <PopulatedDetourRows data={data} />
  )

const PopulatedDetourRows = ({ data }: { data: SimpleDetour[] }) => {
  const epochNowInSeconds = useCurrentTimeSeconds()

  return (
    <>
      {data.map((detour, index) => (
        <tr key={index}>
          <td className="align-middle p-3">
            <div className="d-flex">
              <RoutePill routeName={detour.route} />
              <div className="c-detours-table__route-info-text d-inline-block">
                <div className="pb-1 fs-4 fw-semibold">{detour.name}</div>
                <div className="c-detours-table__route-info-direction fs-6">
                  {detour.direction}
                </div>
              </div>
            </div>
          </td>
          <td className="align-middle p-3 u-hide-for-mobile">
            {detour.intersection}
          </td>
          <td className="align-middle p-3 u-hide-for-mobile">
            {timeAgoLabel(epochNowInSeconds, detour.updatedAt)}
          </td>
        </tr>
      ))}
    </>
  )
}

const EmptyDetourRows = ({ message }: { message: string }) => (
  <tr>
    <td colSpan={3} className="p-3 p-md-4">
      <div className="d-flex justify-content-center mb-3">
        <EmptyDetourTableIcon height="100px" width="100px" />
      </div>
      <div className="d-flex justify-content-center">
        <p className="fs-3 fw-light m-0">{message}</p>
      </div>
    </td>
  </tr>
)

export const EmptyDetourTableIcon = (props: ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 101 97"
    fill="none"
    aria-hidden
    {...props}
  >
    <path
      d="M50.7593 96.3069C78.7676 95.6159 101.216 73.7201 100.483 47.9743C99.7264 21.4318 77.8338 0.0142709 50.2246 0.154493C22.6152 0.29649 0.353077 21.9361 0.50073 48.4878C0.648383 75.0396 23.1499 96.4489 50.7593 96.3069Z"
      fill="#DBDDE1"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M77.8546 42.8941L75.109 22.182C74.4117 18.4448 71.9552 16.9864 68.3003 15.457C62.3115 13.3999 55.9969 12.29 49.6168 12.173C43.2269 12.2913 36.9025 13.4011 30.9028 15.457C27.2934 16.9576 24.8367 18.4442 24.0937 22.1814L21.3335 42.8941V71.5485H26.1788V76.5389C26.1854 78.5889 27.9643 80.2491 30.1604 80.2547C32.3563 80.2487 34.1348 78.5884 34.1413 76.5385V71.5481H65.1922V76.5385C65.1818 77.8726 65.9382 79.1096 67.1742 79.7796C68.4101 80.4495 69.9359 80.4495 71.1719 79.7796C72.4079 79.1096 73.1643 77.8726 73.1538 76.5385V71.5481H77.8552L77.8546 42.8941ZM37.9849 17.4111H61.3396C62.328 17.4111 63.1292 18.1591 63.1292 19.0817C63.1292 20.0044 62.328 20.7523 61.3396 20.7523H37.9849C36.9965 20.7523 36.1953 20.0044 36.1953 19.0817C36.1953 18.1591 36.9965 17.4111 37.9849 17.4111ZM28.6269 25.9337L26.3532 42.2854C26.323 42.4731 26.323 42.6639 26.3532 42.8517C26.3241 43.4151 26.5364 43.9662 26.9433 44.3832C27.3502 44.8002 27.9182 45.0489 28.5218 45.0743H70.8784C71.481 45.0804 72.061 44.8605 72.4884 44.4639C72.9158 44.0674 73.1549 43.5273 73.1521 42.9648V42.8517C73.1826 42.664 73.1826 42.4731 73.1521 42.2854L70.8784 25.9337C70.6956 24.9045 69.7364 24.1533 68.6189 24.1642H30.9006C29.7801 24.153 28.8166 24.9028 28.6269 25.9337ZM30.1604 62.6858C27.8195 62.6898 25.9183 60.9216 25.9139 58.7363C25.9096 56.551 27.8036 54.7762 30.1445 54.772C32.4854 54.7678 34.3868 56.5358 34.3914 58.7211C34.3943 59.7708 33.95 60.7786 33.1563 61.5223C32.3627 62.266 31.2849 62.6846 30.1604 62.6858ZM64.9351 58.7263C64.9335 60.9096 66.8266 62.6815 69.1654 62.6858H69.1648C70.2922 62.6887 71.3743 62.272 72.1716 61.5278C72.9688 60.7837 73.4154 59.7735 73.4125 58.7211C73.4079 56.5378 71.5098 54.7705 69.171 54.772C66.8322 54.7734 64.9366 56.543 64.9351 58.7263Z"
      fill="#1C1E23"
    />
  </svg>
)
