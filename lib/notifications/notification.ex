defmodule Notifications.Notification do
  import Skate.Repo

  alias Schedule.Block
  alias Schedule.Gtfs.Service
  alias Schedule.Route
  alias Schedule.Trip
  alias Schedule.Hastus.Run
  alias Notifications.NotificationReason
  alias Notifications.Db.Notification, as: DbNotification

  require Logger

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

  @spec create(t(), (DbNotification.t() -> t())) :: t()
  def create(notification_without_id, insertion_callback \\ fn _ -> nil end) do
    changeset =
      DbNotification.changeset(
        %DbNotification{},
        Map.from_struct(notification_without_id)
      )

    id =
      case insert(changeset) do
        {:ok, db_notification} ->
          notification_with_id = %{notification_without_id | id: db_notification.id}
          log_creation(notification_with_id)
          insertion_callback.(notification_with_id)
          db_notification.id

        {:error, _changeset} ->
          nil
      end

    %__MODULE__{notification_without_id | id: id}
  end

  defp log_creation(notification) do
    Logger.warn("Notification created new notification new_notification=#{inspect(notification)}")
  end
end
