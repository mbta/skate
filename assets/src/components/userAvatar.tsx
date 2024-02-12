import React from "react"

export const UserAvatar = ({ userName }: { userName: string }) => {
  const firstLetter = userName.charAt(0).toUpperCase()

  return (
    <svg viewBox="0 0 32 32" className="c-user-avatar">
      <circle cx={16} cy={16} r={16} className="c-user-avatar__circle" />
      <text x={16} y={23}>
        {firstLetter}
      </text>
    </svg>
  )
}
