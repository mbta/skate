defmodule Skate.BridgeStatus do
  @moduledoc """
  Context for recording and deduplicating Bridge status changes reported from
  `Notifications.Bridge` and creating notifications from those reports.

  ## Options
  This module sources additional configuration from the `:skate` application
  environment under the `Skate.BridgeStatus` key, this expects a `Keyword` list.
  """

  import Ecto.Query

  @doc """
  Accepts a bridge status change event and creates a
  `Notifications.Db.BridgeMovement` notification.

  If a `Notifications.Db.BridgeMovement` with the same `:status` has an
  `:inserted_at` timestamp newer than the current time shifted by the
  `:blackout_period` option, then a notification **will not** be created, and
  will return the following error.

  ```elixir
  {:error, {:bridge_movement_already_exists, "Bridge Movement Already Exists"}}
  ```

  ## Options
  | Option             | Purpose                                                                                                              |
  |--------------------|----------------------------------------------------------------------------------------------------------------------|
  | `bridge_route_ids` | Describes the `Schedule.Gtfs.Route.id()` affected by the bridge for determining which users to send notifications to |
  | `blackout_period`  | Intended to be 2 times the `@fetch_ms` config from `Notifications.Bridge`                                            |

  See the [Options](#module-options) documentation for more info.
  """
  def maybe_record_bridge_status(attrs, opts \\ []) do
    opts = add_config_opts(opts)

    attrs = add_users_to_notification_params(attrs, opts)

    Ecto.Multi.new()
    |> lock_bridge_movements_table()
    |> assert_bridge_movement_nonexistent(attrs, opts)
    |> Ecto.Multi.run(:bridge_movement_notification, fn _repo, _multi ->
      Notifications.Notification.create_bridge_movement_notification(attrs)
    end)
    |> Skate.Repo.transaction()
    |> case do
      {:ok, %{bridge_movement_notification: out}} -> {:ok, out}
      {:error, name, message, _multi_map} -> {:error, {name, message}}
    end
  end

  # Sources configuration for options from config in addition to
  # parameters to allow callers to leave options up to configuration
  # values
  defp add_config_opts(opts) do
    opts ++ Application.get_env(:skate, __MODULE__, [])
  end

  defp lock_bridge_movements_table(multi) do
    Ecto.Multi.run(multi, :lock_bridge_movements_table, fn repo, _ ->
      repo.query("LOCK TABLE bridge_movements")
    end)
  end

  defp assert_bridge_movement_nonexistent(multi, %{status: status}, opts) do
    cutoff_time = cutoff_time(opts)

    multi
    |> Ecto.Multi.exists?(
      :bridge_movement_exists?,
      from(bm in Notifications.Db.BridgeMovement,
        where: bm.status == ^status,
        where: bm.inserted_at > ^cutoff_time
      )
    )
    |> Ecto.Multi.run(:bridge_movement_already_exists, fn
      _, %{bridge_movement_exists?: true} -> {:error, "Bridge Movement Already Exists"}
      _, %{bridge_movement_exists?: false} -> {:ok, false}
    end)
  end

  defp cutoff_time(opts) do
    # The bridge API doesn't have anything like an "updated at" timestamp
    # so we assume that, if we see two bridge movements within a blackout
    # period, they are actually the same movement and what's happening is
    # that we have multiple servers trying to insert a movement at once.
    blackout_period = Keyword.fetch!(opts, :blackout_period)
    now = current_time(opts)

    DateTime.shift(now, blackout_period)
  end

  if Mix.env() != :test do
    defp current_time(_opts), do: DateTime.utc_now()
  else
    # if we're testing, allow setting the time via `opts`
    defp current_time(opts), do: Keyword.get_lazy(opts, :test_time, &DateTime.utc_now/0)
  end

  defp add_users_to_notification_params(attrs, opts) do
    bridge_route_ids = Keyword.fetch!(opts, :bridge_route_ids)

    users = Skate.Settings.User.list_users_with_route_ids(bridge_route_ids)

    Map.merge(attrs, %{notification: %{users: users}}, fn
      :notification, attr_val, merge_val -> Map.merge(attr_val, merge_val)
      _, attr_val, _ -> attr_val
    end)
  end
end
