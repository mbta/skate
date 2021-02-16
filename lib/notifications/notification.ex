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

  @spec get_or_create_from_block_waiver(map()) :: t()
  def get_or_create_from_block_waiver(block_waiver_values) do
    changeset =
      DbNotification.block_waiver_changeset(
        %DbNotification{},
        block_waiver_values
      )

    db_record =
      case Skate.Repo.transaction(fn ->
             with {:ok, db_record} <- insert(changeset, on_conflict: :nothing),
                  false <- is_nil(db_record.id),
                  notification_with_id <-
                    struct!(__MODULE__, Map.merge(block_waiver_values, %{id: db_record.id})) do
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
          Skate.Repo.one!(
            from(n in DbNotification,
              join: bw in assoc(n, :block_waiver),
              where:
                bw.start_time == ^block_waiver_values.start_time and
                  bw.end_time == ^block_waiver_values.end_time and
                  bw.block_id == ^block_waiver_values.block_id and
                  bw.service_id == ^block_waiver_values.service_id and
                  bw.reason == ^block_waiver_values.reason
            )
          )
      end

    struct!(__MODULE__, Map.merge(block_waiver_values, %{id: db_record.id}))
  end

  def unexpired_notifications_for_user(username, now_fn \\ &Util.Time.now/0) do
    cutoff_time = now_fn.() - @notification_expiration_threshold

    query =
      from(n in DbNotification,
        join: nu in assoc(n, :notification_users),
        join: u in assoc(nu, :user),
        left_join: bw in assoc(n, :block_waiver),
        select: %{
          id: n.id,
          created_at: n.created_at,
          state: nu.state,
          block_waiver: %{
            reason: bw.reason,
            route_ids: bw.route_ids,
            run_ids: bw.run_ids,
            trip_ids: bw.trip_ids,
            operator_id: bw.operator_id,
            operator_name: bw.operator_name,
            route_id_at_creation: bw.route_id_at_creation,
            block_id: bw.block_id,
            service_id: bw.service_id,
            start_time: bw.start_time,
            end_time: bw.end_time
          }
        },
        where: n.created_at > ^cutoff_time and u.username == ^username,
        order_by: [desc: n.created_at]
      )

    query
    |> Skate.Repo.all()
    |> Enum.map(&convert_from_db_notification/1)
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

  defp convert_from_db_notification(db_notification) do
    basic_fields = %{
      id: db_notification.id,
      created_at: db_notification.created_at,
      state: db_notification.state
    }

    detail_fields =
      cond do
        db_notification.block_waiver ->
          db_notification.block_waiver
      end

    struct(__MODULE__, Map.merge(basic_fields, detail_fields))
  end
end
