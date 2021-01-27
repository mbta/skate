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
  alias Notifications.NotificationState
  alias Notifications.Db.BlockWaiver, as: DbBlockWaiver
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser

  require Logger

  @notification_expiration_threshold 8 * 60 * 60

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
          end_time: Util.Time.timestamp(),
          state: NotificationState.t() | nil
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
    :end_time,
    :state
  ]

  @spec get_or_create(t()) :: t()
  def get_or_create(notification_without_id) do
    changeset =
      DbNotification.changeset(%DbNotification{}, Map.from_struct(notification_without_id))

    db_record =
      case Skate.Repo.transaction(fn ->
             with db_record <- insert!(changeset, on_conflict: :nothing),
                  false <- is_nil(db_record.id),
                  notification_with_id <- %__MODULE__{notification_without_id | id: db_record.id},
                  false <- is_nil(duplicate_to_block_waiver(db_record)) do
               log_creation(notification_with_id)
               link_notification_to_users(notification_with_id)
               db_record
             else
               _ -> Skate.Repo.rollback(nil)
             end
           end) do
        {:ok, db_record} when not is_nil(db_record) ->
          db_record

        {:error, _} ->
          identifying_fields =
            notification_without_id
            |> Map.take([:start_time, :end_time, :block_id, :service_id, :reason])
            |> Map.to_list()

          Skate.Repo.one!(from(DbNotification, where: ^identifying_fields))
      end

    %__MODULE__{notification_without_id | id: db_record.id}
  end

  def unexpired_notifications_for_user(username, now_fn \\ &Util.Time.now/0) do
    cutoff_time = now_fn.() - @notification_expiration_threshold

    query =
      from(n in DbNotification,
        join: nu in assoc(n, :notification_users),
        join: u in assoc(nu, :user),
        select_merge: %{state: nu.state},
        where: n.created_at > ^cutoff_time and u.username == ^username,
        order_by: [desc: n.created_at]
      )

    Skate.Repo.all(query) |> Enum.map(&from_db_notification/1)
  end

  def update_read_states(username, notification_ids, read_state)
      when read_state in [:read, :unread, :deleted] do
    query =
      from(nu in DbNotificationUser,
        join: u in assoc(nu, :user),
        where: u.username == ^username,
        where: nu.notification_id in ^notification_ids
      )

    Skate.Repo.update_all(query, set: [state: read_state])
  end

  @spec duplicate_to_block_waiver(DbNotification.t()) :: DbNotification.t() | nil
  def duplicate_to_block_waiver(db_notification) do
    new_waiver_params =
      Map.from_struct(db_notification)
      |> Map.put(:id, nil)

    case %DbBlockWaiver{}
         |> DbBlockWaiver.changeset(new_waiver_params)
         |> Skate.Repo.insert() do
      {:ok, waiver} ->
        db_notification
        |> DbNotification.changeset(%{block_waiver_id: waiver.id})
        |> Skate.Repo.update()

      {:error, _} ->
        nil
    end
  end

  defp log_creation(notification) do
    Logger.warn("Notification created new_notification=#{inspect(notification)}")
  end

  defp link_notification_to_users(notification) do
    naive_now_fn = Application.get_env(:skate, :naive_now_fn, &Util.Time.naive_now/0)
    now = naive_now_fn.()
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

  defp from_db_notification(db_notification) do
    struct(__MODULE__, Map.from_struct(db_notification))
  end
end
