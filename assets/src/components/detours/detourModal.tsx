import React from "react"
import { DiversionPage, DiversionPageStateProps } from "./diversionPage"
import { Modal } from "@restart/ui"
import { ModalTransitionProps } from "@restart/ui/esm/Modal"
import { CSSTransition } from "react-transition-group"
import { Spinner } from "react-bootstrap"
import { useParams, useNavigate, useSearchParams } from "react-router-dom"
import { useLoadDetour } from "../../hooks/useLoadDetour"
import { OriginalRoute } from "../../models/detour"

const Fade = ({ children, ...props }: ModalTransitionProps) => (
  <CSSTransition
    timeout={300}
    classNames="c-detour-modal__transition"
    {...props}
  >
    {children}
  </CSSTransition>
)

export const DetourModal = ({
  onClose,
  onOpenDetour,
  show,
  detourId,
  isNewDetour,
  originalRoute,
  showFromCopy = false,
  ...useDetourProps
}: {
  onClose: () => void
  onOpenDetour?: (detourId: number) => void
  show: boolean
  isNewDetour?: boolean // could be original route
  detourId?: number
  originalRoute?: OriginalRoute
  showFromCopy?: boolean
}) => {
  const { detour, isLoading: isLoadingDetour } = useLoadDetour(detourId)

  if (!isLoadingDetour && detour === null) {
    return (
      <div className="text-bg-light position-absolute inset-0 opacity-75 d-flex justify-content-center align-items-center">
        Detour not found
      </div>
    )
  }

  const detourForPage: DiversionPageStateProps = detour
    ? {
        snapshot: detour.state,
        author: detour.author,
        updatedAt: detour.updatedAt,
      }
      : { originalRoute: originalRoute || {} }

  return (
    <Modal className="c-detour-modal" show={show} transition={Fade}>
      {isLoadingDetour && !isNewDetour ? (
        <div className="text-bg-light position-absolute inset-0 opacity-75 d-flex justify-content-center align-items-center">
          <Spinner />
        </div>
      ) : (
        <DiversionPage
          {...useDetourProps}
          {...detourForPage}
          onClose={onClose}
          onOpenDetour={onOpenDetour}
          showFromCopy={showFromCopy}
        />
      )}
    </Modal>
  )
}

const FromRouterParam = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const showFromCopyParams = searchParams.get("fromCopy") === "true"
  const numberId = typeof id !== "undefined" ? parseInt(id) : id
  return <>{id && <DetourModal onClose={() => navigate("/detours")} detourId={numberId} show={true} showFromCopy={showFromCopyParams} />}</>
}

DetourModal.FromRouterParam = FromRouterParam
