defmodule Notifications.Notification do
  import Skate.Repo

  import Ecto.Query

  alias Schedule.Block
  alias Schedule.Gtfs.Service
  alias Schedule.Route
  alias Schedule.Trip
  alias Schedule.Hastus.Run
  alias Skate.Settings.User
  alias Notifications.NotificationReason
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser

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

  @spec get_or_create(t()) :: t()
  def get_or_create(notification_without_id) do
    changeset =
      DbNotification.changeset(%DbNotification{}, Map.from_struct(notification_without_id))

    db_record = insert!(changeset, on_conflict: :nothing)

    db_record =
      if db_record.id do
        notification_with_id = %__MODULE__{notification_without_id | id: db_record.id}
        log_creation(notification_with_id)
        link_notification_to_users(notification_with_id)
        db_record
      else
        identifying_fields =
          notification_without_id
          |> Map.take([:start_time, :end_time, :block_id, :service_id, :reason])
          |> Map.to_list()

        Skate.Repo.one(from(DbNotification, where: ^identifying_fields))
      end

    %__MODULE__{notification_without_id | id: db_record.id}
  end

  defp log_creation(notification) do
    Logger.warn("Notification created new_notification=#{inspect(notification)}")
  end

  defp link_notification_to_users(notification) do
    now = NaiveDateTime.utc_now() |> NaiveDateTime.truncate(:second)

    user_ids = User.user_ids_for_route_ids(notification.route_ids)

    notification_user_maps =
      Enum.map(user_ids, fn user_id ->
        %{
          notification_id: notification.id,
          user_id: user_id,
          state: :unread,
          inserted_at: now,
          updated_at: now
        }
      end)

    Skate.Repo.insert_all(
      DbNotificationUser,
      notification_user_maps
    )
  end
end
