import React from "react"

export const LoggedInAs = ({ email }: { email: string }) => (
  <div className="c-logged-in-as__container">
    <div className="c-logged-in-as__icon">{email[0]?.toUpperCase() ?? ""}</div>
    <div className="c-logged-in-as__text">
      <p>Logged in as</p>
      <p className="c-logged-in-as__email">{email}</p>
    </div>
  </div>
)
