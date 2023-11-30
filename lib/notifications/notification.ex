defmodule Notifications.Notification do
  @moduledoc false

  import Skate.Repo

  import Ecto.Query

  alias Schedule.Route
  alias Schedule.Trip
  alias Schedule.Hastus.Run
  alias Skate.Settings.Db.User, as: DbUser
  alias Skate.Settings.User
  alias Notifications.NotificationReason
  alias Notifications.NotificationState
  alias Notifications.Db.Notification, as: DbNotification
  alias Notifications.Db.NotificationUser, as: DbNotificationUser

  require Logger

  @notification_expiration_threshold 8 * 60 * 60

  @bridge_lowering_blackout 120
  @chelsea_st_bridge_route_ids ~w[112 743]

  @type id :: integer()

  @type t() :: %__MODULE__{
          id: id() | nil,
          created_at: Util.Time.timestamp(),
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

    notification_values = block_waiver_values |> Map.delete(:block_id) |> Map.delete(:service_id)

    db_record =
      case Skate.Repo.transaction(fn ->
             with {:ok, db_record} <- insert(changeset, on_conflict: :nothing),
                  false <- is_nil(db_record.id),
                  notification_with_id <-
                    struct!(__MODULE__, Map.merge(notification_values, %{id: db_record.id})) do
               log_creation(notification_with_id)

               link_notification_to_users(
                 db_record.id,
                 Map.fetch!(block_waiver_values, :route_ids)
               )

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

    struct!(__MODULE__, Map.merge(notification_values, %{id: db_record.id}))
  end

  def get_or_create_from_bridge_movement(bridge_movement_values) do
    created_at = DateTime.utc_now() |> DateTime.to_unix()

    {:ok, {source, db_record}} =
      Skate.Repo.transaction(fn ->
        Skate.Repo.query!("LOCK TABLE bridge_movements")

        # The bridge API doesn't have anything like an "updated at" timestamp
        # so we assume that, if we see two bridge movements within a blackout
        # period, they are actually the same movement and what's happening is
        # that we have multiple servers trying to insert a movement at once.
        cutoff_time = NaiveDateTime.utc_now() |> NaiveDateTime.add(-@bridge_lowering_blackout)

        existing_record =
          Skate.Repo.one(
            from(n in DbNotification,
              join: bm in assoc(n, :bridge_movement),
              where: bm.inserted_at > ^cutoff_time,
              order_by: [desc: bm.inserted_at],
              limit: 1
            )
          )

        if existing_record do
          {:existing_record, existing_record}
        else
          changeset =
            DbNotification.bridge_movement_changeset(
              %DbNotification{created_at: created_at},
              bridge_movement_values
            )

          {:ok, new_record} = Skate.Repo.insert(changeset)
          link_notification_to_users(new_record.id, @chelsea_st_bridge_route_ids)
          {:new_record, new_record}
        end
      end)

    {reason, end_time} =
      if bridge_movement_values.status == :raised do
        {:chelsea_st_bridge_raised, bridge_movement_values.lowering_time}
      else
        {:chelsea_st_bridge_lowered, nil}
      end

    notification = %__MODULE__{
      id: db_record.id,
      created_at: db_record.created_at,
      reason: reason,
      route_ids: @chelsea_st_bridge_route_ids,
      run_ids: [],
      trip_ids: [],
      start_time: db_record.created_at,
      end_time: end_time,
      state: :unread
    }

    if source == :new_record, do: log_creation(notification)
    notification
  end

  @spec unexpired_notifications_for_user(DbUser.id(), (() -> Util.Time.timestamp())) :: [t()]
  def unexpired_notifications_for_user(user_id, now_fn \\ &Util.Time.now/0) do
    cutoff_time = now_fn.() - @notification_expiration_threshold

    query =
      from(n in DbNotification,
        join: nu in assoc(n, :notification_users),
        join: u in assoc(nu, :user),
        left_join: bw in assoc(n, :block_waiver),
        left_join: bm in assoc(n, :bridge_movement),
        select: %{
          id: n.id,
          created_at: n.created_at,
          state: nu.state,
          block_waiver: bw,
          bridge_movement: bm
        },
        where: n.created_at > ^cutoff_time and u.id == ^user_id,
        order_by: [desc: n.created_at]
      )

    query
    |> Skate.Repo.all()
    |> Enum.map(&convert_from_db_notification/1)
  end

  @spec update_read_states(DbUser.id(), [id()], NotificationState.t()) ::
          {non_neg_integer(), nil | [term()]}
  def update_read_states(user_id, notification_ids, read_state)
      when read_state in [:read, :unread, :deleted] do
    query =
      from(nu in DbNotificationUser,
        join: u in assoc(nu, :user),
        where: u.id == ^user_id,
        where: nu.notification_id in ^notification_ids
      )

    Skate.Repo.update_all(query, set: [state: read_state])
  end

  defp log_creation(notification) do
    Logger.info("Notification created new_notification=#{inspect(notification)}")
  end

  defp link_notification_to_users(notification_id, notification_route_ids) do
    naive_now_fn = Application.get_env(:skate, :naive_now_fn, &Util.Time.naive_now/0)
    now = naive_now_fn.()
    user_ids = User.user_ids_for_route_ids(notification_route_ids)

    notification_user_maps =
      Enum.map(user_ids, fn user_id ->
        %{
          notification_id: notification_id,
          user_id: user_id,
          state: :unread,
          inserted_at: now,
          updated_at: now
        }
      end)

    Skate.Repo.insert_all(
      DbNotificationUser,
      notification_user_maps,
      on_conflict: :nothing
    )
  end

  @spec convert_from_db_notification(DbNotification.t()) :: __MODULE__.t()
  defp convert_from_db_notification(db_notification) do
    basic_fields = %{
      id: db_notification.id,
      created_at: db_notification.created_at,
      state: db_notification.state
    }

    block_waiver = Map.get(db_notification, :block_waiver)
    bridge_movement = Map.get(db_notification, :bridge_movement)

    detail_fields =
      cond do
        block_waiver ->
          Map.from_struct(block_waiver) |> Map.delete(:id)

        bridge_movement ->
          {reason, end_time} =
            if bridge_movement.status == :raised do
              {:chelsea_st_bridge_raised, bridge_movement.lowering_time}
            else
              {:chelsea_st_bridge_lowered,
               db_notification.created_at + @notification_expiration_threshold}
            end

          %{
            reason: reason,
            route_ids: @chelsea_st_bridge_route_ids,
            run_ids: [],
            trip_ids: [],
            start_time: db_notification.created_at,
            end_time: end_time
          }
      end

    struct(__MODULE__, Map.merge(basic_fields, detail_fields))
  end
end
