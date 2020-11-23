defmodule Notifications.Notification do
  import Skate.Repo
  import Ecto.Query

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

  @spec get_or_create(t(), (DbNotification.t() -> t())) :: t()
  def get_or_create(notification_without_id, insertion_callback \\ fn _ -> nil end) do
    identifying_fields =
      Map.take(notification_without_id, [:start_time, :end_time, :block_id, :service_id, :reason])
      |> Map.to_list()

    {:ok, db_record} =
      Skate.Repo.transaction(fn ->
        existing_record = Skate.Repo.one(from(DbNotification, where: ^identifying_fields))

        if existing_record do
          existing_record
        else
          changeset =
            DbNotification.changeset(
              %DbNotification{},
              Map.from_struct(notification_without_id)
            )

          db_notification = insert!(changeset)
          notification_with_id = %{notification_without_id | id: db_notification.id}
          log_creation(notification_with_id)
          insertion_callback.(notification_with_id)
          db_notification
        end
      end)

    %__MODULE__{notification_without_id | id: db_record.id}
  end

  defp log_creation(notification) do
    Logger.warn("Notification created new notification new_notification=#{inspect(notification)}")
  end
end
