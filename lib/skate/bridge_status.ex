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
    opts = get_config(opts)

    attrs = add_affected_route_ids(attrs, opts)

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

  @valid_test_options []
  # Valid Test Options
  if Mix.env() == :test, do: @valid_test_options([:test_time])

  defp valid_options, do: [:blackout_period, :bridge_route_ids | @valid_test_options]

  # Sources configuration for options from config in addition to
  # parameters to allow callers to leave options up to configuration
  # values
  defp get_config(opts) do
    Keyword.take(
      opts ++ Application.get_env(:skate, __MODULE__, []),
      valid_options()
    )
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
    now = Keyword.get_lazy(opts, :test_time, &DateTime.utc_now/0)

    DateTime.shift(now, blackout_period)
  end

  defp add_affected_route_ids(attrs, opts) do
    Map.put_new_lazy(attrs, :bridge_route_ids, fn ->
      Keyword.fetch!(opts, :bridge_route_ids)
    end)
  end
end
