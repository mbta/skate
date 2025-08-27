defmodule Realtime.StateOfChargeStore do
  @moduledoc """
  A GenServer module for managing and caching the state of charge (SOC) information
  for a predefined list of vehicle IDs.
  """

  use GenServer

  @tracked_vehicle_ids [
    "4200",
    "4201",
    "4202",
    "4203",
    "4204",
    "4300",
    "4301",
    "4302",
    "4303",
    "4304"
  ]

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.StateOfChargeStore

  def start_link(opts \\ [tracked_vehicle_ids: @tracked_vehicle_ids, name: default_name()]) do
    {tracked_vehicle_ids, opts} = Keyword.pop(opts, :tracked_vehicle_ids)
    GenServer.start_link(__MODULE__, tracked_vehicle_ids, opts)
  end

  def update(vehicle_id, state_of_charge, name \\ default_name())

  def update(vehicle_id, %{value: value, time: time} = state_of_charge, name)
      when not is_nil(value) and not is_nil(time) do
    GenServer.call(name, {:update, vehicle_id, state_of_charge})
  end

  def update(_vehicle_id, _, _) do
    nil
  end

  def get(vehicle_id, name \\ default_name()) do
    GenServer.call(name, {:get, vehicle_id})
  end

  @impl true
  def init(tracked_vehicle_ids) do
    state = Map.new(tracked_vehicle_ids, fn id -> {id, nil} end)
    {:ok, state}
  end

  @impl true
  def handle_call({:update, vehicle_id, state_of_charge}, _from, state) do
    if Map.has_key?(state, vehicle_id) do
      new_state = Map.put(state, vehicle_id, state_of_charge)
      {:reply, state_of_charge, new_state}
    else
      {:reply, nil, state}
    end
  end

  @impl true
  def handle_call({:get, vehicle_id}, _from, state) do
    state_of_charge = Map.get(state, vehicle_id)
    {:reply, state_of_charge, state}
  end
end
