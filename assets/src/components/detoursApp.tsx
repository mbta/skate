import React, { ReactElement } from "react"
import {
  BrowserRouter,
  // Routes,
  // Route as BrowserRoute,
  // Route,
  // Outlet,
} from "react-router-dom"
import DataStatusBanner from "./dataStatusBanner"
import Nav from "./nav"
import appData from "../appData"
import { DetourListPage } from "./detourListPage"
import inTestGroup, { TestGroups } from "../userInTestGroup"
import { DetourModal } from "./detours/detourModal"

export const DetoursAppRoutes = () => {
  const detourId = appData()?.detourId
  const isNewDetour = appData()?.isNewDetour
  return (
    <div className="l-app">
      <div className="l-app__banner">
        <DataStatusBanner />
      </div>
      <div className="l-app__main">
        {/* <Route
            element={ */}
        {inTestGroup(TestGroups.DetoursList) && (
          <>
            {detourId ? (
              <DetourModal.FromRouterParam detourId={detourId} />
            ) : isNewDetour ? (
              <DetourModal.NewFromRouterParam />
            ) : (
              <Nav>
                <DetourListPage />
              </Nav>
            )}
            {/* <BrowserRoute
                  path="/detours"
                  element={<DetourListPage />}
                />
                <BrowserRoute
                  path="/detours/new"
                  element={<DetourModal.NewFromRouterParam />}
                />
                <BrowserRoute
                  path="/detours/:id"
                  element={<DetourModal.FromRouterParam />}
                /> */}
          </>
        )}
        {/* </Route>
        </Routes> */}
      </div>
    </div>
  )
}

const DetoursApp = (): ReactElement<HTMLDivElement> => {
  return (
    <BrowserRouter>
      <DetoursAppRoutes />
    </BrowserRouter>
  )
}

export default DetoursApp
