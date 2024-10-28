import { AnyActorLogic, Snapshot, createActor } from "xstate"
import { Result, Err, Ok } from "./result"

/**
 * Checks if the provided object, {@linkcode snapshot}, is a "valid" snapshot
 * for the provided state machine {@linkcode actorLogic}.
 */
export const isValidSnapshot = (
  actorLogic: AnyActorLogic,
  snapshot: unknown
): Result<Snapshot<unknown>, "Invalid Snapshot Type" | "Bad Snapshot"> => {
  if (typeof snapshot !== "object" || snapshot === null) {
    return Err("Invalid Snapshot Type")
  }

  // Check that machine initializes from snapshot without errors
  const actor = createActor(actorLogic, {
    snapshot: snapshot as any,
    input: undefined,
  })

  if (actor.getSnapshot().status === "error") {
    return Err("Bad Snapshot")
  }

  return Ok(snapshot as Snapshot<unknown>)
}
