import React, { ComponentPropsWithoutRef } from "react"

export type NavIconProps = ComponentPropsWithoutRef<"svg">

export const DetourNavIcon = (props: NavIconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="100%"
    height="100%"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden
    {...props}
  >
    <path
      d="M0.292893 22.2929C-0.0976311 22.6834 -0.0976311 23.3166 0.292893 23.7071C0.683417 24.0976 1.31658 24.0976 1.70711 23.7071L0.292893 22.2929ZM4.5 19.5L5.20711 20.2071C5.39464 20.0196 5.5 19.7652 5.5 19.5H4.5ZM4.5 9L3.83564 8.25259C3.62215 8.44236 3.5 8.71436 3.5 9H4.5ZM9 5L9.31623 4.05132C8.97689 3.9382 8.60298 4.01495 8.33564 4.25259L9 5ZM16.5 7.5L16.1838 8.44868C16.5431 8.56846 16.9393 8.47494 17.2071 8.20711L16.5 7.5ZM24 1C24 0.447715 23.5523 0 23 0H14C13.4477 0 13 0.447715 13 1C13 1.55228 13.4477 2 14 2H22V10C22 10.5523 22.4477 11 23 11C23.5523 11 24 10.5523 24 10V1ZM1.70711 23.7071L5.20711 20.2071L3.79289 18.7929L0.292893 22.2929L1.70711 23.7071ZM5.5 19.5V9H3.5V19.5H5.5ZM5.16436 9.74741L9.66436 5.74741L8.33564 4.25259L3.83564 8.25259L5.16436 9.74741ZM8.68377 5.94868L16.1838 8.44868L16.8162 6.55132L9.31623 4.05132L8.68377 5.94868ZM17.2071 8.20711L23.7071 1.70711L22.2929 0.292893L15.7929 6.79289L17.2071 8.20711Z"
      fill="currentColor"
    />
    <path
      d="M6.52809 17.457L7.9423 16.0428"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M9.79289 14.207L11.2071 12.7928"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M13.0577 10.957L14.4719 9.54282"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
)
