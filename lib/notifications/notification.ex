defmodule Notifications.Notification do
  alias Schedule.Route
  alias Schedule.Trip

  @type notification_reason :: :manpower | :disabled | :diverted | :accident

  @type t() :: %__MODULE__{
          created_at: Util.Time.timestamp(),
          reason: notification_reason(),
          route_ids: [Route.id()],
          run_ids: [String.t()],
          trip_ids: [Trip.id()]
        }

  @derive Jason.Encoder

  defstruct [
    :created_at,
    :reason,
    :route_ids,
    :run_ids,
    :trip_ids
  ]
end
