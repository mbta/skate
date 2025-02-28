import { fromCallback, Snapshot } from "xstate"
import { putDetourUpdate } from "../api"
import { isOk } from "../util/result"

export type DetourApiEvent = PutDetourUpdateEvent

type PutDetourUpdateEvent = {
  type: "put-detour-update"
  data: Snapshot<unknown>
}

export const detourApiActor = fromCallback(({ sendBack, receive }) => {
  receive((event: DetourApiEvent) => {
    if (event.type === "put-detour-update") {
      sendBack({ type: "detour.save.begin-save" })
      putDetourUpdate(event.data).then((uuid) => {
        if (isOk(uuid)) {
          sendBack({ type: "detour.save.set-uuid", uuid: uuid.ok })
        }
      })
    }
  })
})
