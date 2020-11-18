defmodule Notifications.Notification do
  import Skate.Repo

  alias Schedule.Block
  alias Schedule.Gtfs.Service
  alias Schedule.Route
  alias Schedule.Trip
  alias Schedule.Hastus.Run
  alias Notifications.NotificationReason
  alias Notifications.Db.Notification, as: DbNotification

  @type id :: integer()

  @type t() :: %__MODULE__{
          id: id() | nil,
          created_at: Util.Time.timestamp(),
          block_id: Block.id(),
          service_id: Service.id(),
          reason: NotificationReason.t(),
          route_ids: [Route.id()],
          run_ids: [Run.id()],
          trip_ids: [Trip.id()],
          operator_id: String.t() | nil,
          operator_name: String.t() | nil,
          route_id_at_creation: Route.id() | nil,
          start_time: Util.Time.timestamp(),
          end_time: Util.Time.timestamp()
        }

  @derive Jason.Encoder

  @enforce_keys [
    :block_id,
    :service_id,
    :created_at,
    :reason,
    :route_ids,
    :run_ids,
    :trip_ids,
    :start_time,
    :end_time
  ]

  defstruct [
    :id,
    :block_id,
    :service_id,
    :created_at,
    :reason,
    :route_ids,
    :run_ids,
    :trip_ids,
    :operator_id,
    :operator_name,
    :route_id_at_creation,
    :start_time,
    :end_time
  ]

  @spec create([t()]) :: [t()]
  def create(notification_without_id) do
    changeset =
      DbNotification.changeset(
        %DbNotification{},
        Map.from_struct(notification_without_id)
      )

    _id = insert!(changeset)

    # %{notification_without_id | id: id}
    notification_without_id
  end
end
