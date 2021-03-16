defmodule Realtime.BlockOverloadStore do
  use GenServer

  alias Notifications.NotificationServer
  alias Realtime.Vehicle

  def default_name(), do: __MODULE__

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    GenServer.start_link(__MODULE__, nil, name: name)
  end

  @spec update([Vehicle.t()], GenServer.name()) :: :ok
  def update(overloaded_vehicles, server \\ default_name()) do
    GenServer.cast(server, {:update, overloaded_vehicles})
    :ok
  end

  @impl GenServer
  def init(_) do
    {:ok, nil}
  end

  @impl GenServer
  def handle_cast({:update, overloaded_vehicles}, state) do
    new_vehicles =
      if state do
        old_overload_identifiers = Enum.map(state, &overload_identifier/1)

        Enum.reject(
          overloaded_vehicles,
          &Enum.member?(old_overload_identifiers, overload_identifier(&1))
        )
      else
        []
      end

    new_block_overloads_fn =
      Application.get_env(
        :skate,
        :new_block_overloads_fn,
        &NotificationServer.new_block_overloads/1
      )

    _ = new_block_overloads_fn.(new_vehicles)

    {:noreply, overloaded_vehicles}
  end

  defp overload_identifier(vehicle) do
    Map.take(vehicle, [:block_id, :vehicle_id])
  end
end
