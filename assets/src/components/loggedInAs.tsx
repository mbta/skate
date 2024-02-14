import React, { ComponentPropsWithoutRef } from "react"
import { UserAvatar } from "./userAvatar"
import { joinClasses } from "../helpers/dom"

export const LoggedInAs = ({
  email,
  ...divProps
}: { email: string } & ComponentPropsWithoutRef<"div">) => (
  <div
    {...divProps}
    className={joinClasses(["c-logged-in-as__container", divProps.className])}
  >
    <div className="c-logged-in-as__icon">
      <UserAvatar userName={email} />
    </div>
    <div className="c-logged-in-as__text">
      <p>Logged in as</p>
      <p className="c-logged-in-as__email">{email}</p>
    </div>
  </div>
)
