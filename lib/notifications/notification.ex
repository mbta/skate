defmodule Notifications.Notification do
  alias Schedule.Route
  alias Schedule.Trip

  @type notification_reason :: :manpower | :disabled | :diverted | :accident

  @type t() :: %__MODULE__{
          created_at: Util.Time.timestamp(),
          reason: notification_reason(),
          route_ids: [Route.id()],
          run_ids: [String.t()],
          trip_ids: [Trip.id()],
          operator_id: String.t() | nil,
          operator_name: String.t() | nil,
          route_id_at_creation: Route.id() | nil,
          start_time: Util.Time.timestamp()
        }

  @derive Jason.Encoder

  defstruct [
    :created_at,
    :reason,
    :route_ids,
    :run_ids,
    :trip_ids,
    :operator_id,
    :operator_name,
    :route_id_at_creation,
    :start_time
  ]
end
