defmodule Realtime.Server do
  @moduledoc """
  Fetches live data from RTR, and forwards it to connected clients.

  Uses a global regsitry, with the server's pid as the key.
  Each subscriber's route_id is stored as the value of their registry entries.
  """

  use GenServer

  alias Schedule.Hastus.Run
  alias Schedule.Route
  alias Schedule.Block

  alias Realtime.{
    DataStatus,
    DataStatusPubSub,
    Ghost,
    Vehicle,
    VehicleOrGhost
  }

  require Logger

  @enforce_keys [:ets]

  defstruct ets: nil,
            active_route_ids: [],
            active_run_ids: [],
            active_block_ids: [],
            active_alert_route_ids: []

  @type subscription_key ::
          {:route_id, Route.id()}
          | :all_shuttles
          | :all_pull_backs
          | :logged_in_vehicles
          | {:search, search_params()}
          | {:limited_search, limited_search_params()}
          | {:vehicle, String.t()}
          | {:run_ids, [Run.id()]}
          | {:block_ids, [Block.id()]}
          | {:alerts, Route.id()}

  @type search_params :: %{
          :text => String.t(),
          :property => search_property(),
          optional(:limit) => pos_integer()
        }

  @type limited_search_params :: %{
          :text => String.t(),
          :property => search_property(),
          optional(:limit) => pos_integer()
        }

  @type search_property :: :all | :run | :vehicle | :operator

  @type lookup_key :: {:ets.tid(), subscription_key}

  @type broadcast_message :: {:new_realtime_data, lookup_key}

  @type limited_search_result :: %{
          matching_vehicles: [VehicleOrGhost.t()],
          has_more_matches: boolean()
        }

  @typep t :: %__MODULE__{
           ets: :ets.tid(),
           active_route_ids: [Route.id()],
           active_run_ids: [Run.id()],
           active_block_ids: [Block.id()],
           active_alert_route_ids: [Route.id()]
         }

  # Client functions

  @spec default_name() :: GenServer.name()
  def default_name(), do: Realtime.Server

  @spec pubsub_name() :: Phoenix.PubSub.t()
  def pubsub_name(), do: Realtime.PubSub

  @spec start_link(Keyword.t()) :: GenServer.on_start()
  def start_link(start_link_opts) do
    GenServer.start_link(__MODULE__, [], start_link_opts)
  end

  @doc """
  The subscribing process will get a message when there's new data, with the form
  ```
  {:new_realtime_data, lookup_args}
  ```
  Those `lookup_args` can be passed into `RealTime.Server.lookup(lookup_args)/1` to get the data.
  """
  @spec subscribe_to_route(Route.id(), GenServer.server()) ::
          {subscription_key(), [VehicleOrGhost.t()]}
  def subscribe_to_route(route_id, server \\ default_name()) do
    subscription_key = {:route_id, route_id}
    {subscription_key, subscribe(server, subscription_key)}
  end

  @spec subscribe_to_all_shuttles(GenServer.server()) :: {subscription_key(), [Vehicle.t()]}
  def subscribe_to_all_shuttles(server \\ default_name()) do
    subscription_key = :all_shuttles
    {subscription_key, subscribe(server, subscription_key)}
  end

  @spec subscribe_to_search(search_params(), GenServer.server()) ::
          {subscription_key(), [VehicleOrGhost.t()]}
  def subscribe_to_search(search_params, server \\ default_name()) do
    subscription_key = {:search, search_params}
    {subscription_key, subscribe(server, subscription_key)}
  end

  @spec subscribe_to_limited_search(search_params(), GenServer.server()) ::
          {subscription_key(), limited_search_result()}
  def subscribe_to_limited_search(search_params, server \\ default_name()) do
    subscription_key = {:limited_search, search_params}
    {subscription_key, subscribe(server, subscription_key)}
  end

  @spec update_limited_search_subscription(search_params(), GenServer.server()) ::
          {subscription_key(), limited_search_result()}
  def update_limited_search_subscription(search_params, server \\ default_name()) do
    subscription_key = {:limited_search, search_params}
    {subscription_key, update_subscription(server, subscription_key)}
  end

  @spec subscribe_to_vehicle(String.t(), GenServer.server()) ::
          {subscription_key(), [VehicleOrGhost.t()]}
  def subscribe_to_vehicle(vehicle_id, server \\ default_name()) do
    subscription_key = {:vehicle, vehicle_id}

    {subscription_key,
     subscribe(
       server,
       subscription_key
     )}
  end

  @spec subscribe_to_run_ids([Run.id()], GenServer.server()) ::
          {subscription_key(), [VehicleOrGhost.t()]}
  def subscribe_to_run_ids(run_ids, server \\ default_name()) do
    subscription_key = {:run_ids, run_ids}
    {subscription_key, subscribe(server, subscription_key)}
  end

  @spec subscribe_to_block_ids([Block.id()], GenServer.server()) ::
          {subscription_key(), [VehicleOrGhost.t()]}
  def subscribe_to_block_ids(block_ids, server \\ default_name()) do
    subscription_key = {:block_ids, block_ids}
    {subscription_key, subscribe(server, subscription_key)}
  end

  @spec subscribe_to_all_pull_backs(GenServer.server()) ::
          {subscription_key(), [VehicleOrGhost.t()]}
  def subscribe_to_all_pull_backs(server \\ default_name()) do
    subscription_key = :all_pull_backs
    {subscription_key, subscribe(server, subscription_key)}
  end

  @spec subscribe_to_alerts(Route.id(), GenServer.server()) :: {subscription_key(), [String.t()]}
  def subscribe_to_alerts(route_id, server \\ default_name()) do
    subscription_key = {:alerts, route_id}
    {subscription_key, subscribe(server, subscription_key)}
  end

  def peek_at_vehicles_by_run_ids(run_ids, server \\ default_name()) do
    {_registry_key, ets} = GenServer.call(server, :subscription_info)
    lookup({ets, {:run_ids, run_ids}})
  end

  def peek_at_vehicle_by_id(vehicle_or_ghost_id, server \\ default_name()) do
    {_registry_key, ets} = GenServer.call(server, :subscription_info)
    lookup({ets, {:vehicle, vehicle_or_ghost_id}})
  end

  @spec subscribe(GenServer.server(), {:route_id, Route.id()}) :: [VehicleOrGhost.t()]
  @spec subscribe(GenServer.server(), :all_shuttles) :: [Vehicle.t()]
  @spec subscribe(GenServer.server(), :logged_in_vehicles) :: [Vehicle.t()]
  @spec subscribe(GenServer.server(), {:search, search_params()}) :: [VehicleOrGhost.t()]
  @spec subscribe(GenServer.server(), {:limited_search, search_params()}) ::
          limited_search_result()
  @spec subscribe(GenServer.server(), {:vehicle, String.t()}) :: [VehicleOrGhost.t()]
  @spec subscribe(GenServer.server(), :all_pull_backs) :: [VehicleOrGhost.t()]
  @spec subscribe(GenServer.server(), {:run_ids, [Run.id()]}) :: [VehicleOrGhost.t()]
  @spec subscribe(GenServer.server(), {:block_ids, [Block.id()]}) :: [VehicleOrGhost.t()]
  @spec subscribe(GenServer.server(), {:alerts, Route.id()}) :: [String.t()]
  defp subscribe(server, {:alerts, _route_id} = subscription_key) do
    {pubsub, ets} = GenServer.call(server, :subscription_info)
    Phoenix.PubSub.subscribe(pubsub, "realtime_alerts")
    lookup({ets, subscription_key})
  end

  defp subscribe(server, subscription_key) do
    {pubsub, ets} = GenServer.call(server, :subscription_info)
    Phoenix.PubSub.subscribe(pubsub, "realtime_vehicles")
    lookup({ets, subscription_key})
  end

  defp update_subscription(server, {:limited_search, _search_params} = subscription_key) do
    {_pubsub, ets} = GenServer.call(server, :subscription_info)

    lookup({ets, subscription_key})
  end

  @spec update_vehicles({Route.by_id([VehicleOrGhost.t()]), [Vehicle.t()], [Vehicle.t()]}) ::
          term()
  @spec update_vehicles(
          {Route.by_id([VehicleOrGhost.t()]), [Vehicle.t()], [Vehicle.t()]},
          GenServer.server()
        ) :: term()
  def update_vehicles(update_term, server \\ __MODULE__)

  def update_vehicles({vehicles_by_route_id, shuttles, logged_out_vehicles}, server) do
    GenServer.cast(
      server,
      {:update_vehicles, vehicles_by_route_id, shuttles, logged_out_vehicles}
    )
  end

  @spec update_alerts(Route.by_id([String.t()]), GenServer.server()) :: term()
  def update_alerts(alerts_by_route_id, server \\ __MODULE__) do
    GenServer.cast(server, {:update_alerts, alerts_by_route_id})
  end

  @spec lookup({:ets.tid(), {:route_id, Route.id()}}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), :logged_in_vehicles}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), :logged_out_vehicles}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), :all_shuttles}) :: [Vehicle.t()]
  @spec lookup({:ets.tid(), {:search, search_params()}}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), {:limited_search, search_params()}}) :: limited_search_result()
  @spec lookup({:ets.tid(), {:vehicle, String.t()}}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), :all_pull_backs}) :: [Vehicle.t()]
  @spec lookup({:ets.tid(), {:run_ids, [Run.id()]}}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), {:block_ids, [Block.id()]}}) :: [VehicleOrGhost.t()]
  @spec lookup({:ets.tid(), {:alerts, Route.id()}}) :: [String.t()]
  def lookup({table, {:search, search_params}}) do
    logged_in_vehicles = lookup({table, :logged_in_vehicles})

    vehicles_to_search =
      logged_in_vehicles ++ lookup({table, :logged_out_vehicles})

    VehicleOrGhost.find_by(vehicles_to_search, search_params)
  end

  def lookup({table, {:limited_search, search_params}}) do
    logged_in_vehicles = lookup({table, :logged_in_vehicles})

    vehicles_to_search =
      logged_in_vehicles ++ lookup({table, :logged_out_vehicles})

    VehicleOrGhost.take_limited_matches(vehicles_to_search, search_params)
  end

  def lookup({table, {:run_ids, run_ids}}) do
    run_ids
    |> Enum.map(fn run_id ->
      try do
        :ets.lookup_element(table, {:run_id, run_id}, 2)
      rescue
        # :ets.lookup_element/3 exits with :badarg when key is not found
        ArgumentError ->
          nil
      end
    end)
    |> Enum.filter(& &1)
  end

  def lookup({table, {:block_ids, block_ids}}) do
    block_ids
    |> Enum.map(fn block_id ->
      try do
        :ets.lookup_element(table, {:block_id, block_id}, 2)
      rescue
        # :ets.lookup_element/3 exits with :badarg when key is not found
        ArgumentError ->
          nil
      end
    end)
    |> Enum.filter(& &1)
  end

  def lookup({table, {:vehicle, vehicle_or_ghost_id}}) do
    logged_in_vehicles = lookup({table, :logged_in_vehicles})
    logged_out_vehicles = lookup({table, :logged_out_vehicles})

    (logged_in_vehicles ++ logged_out_vehicles)
    |> Enum.find(&(&1.id == vehicle_or_ghost_id))
    |> List.wrap()
  end

  def lookup({table, :all_pull_backs}) do
    {table, :logged_in_vehicles}
    |> lookup()
    |> Enum.filter(fn vehicle_or_ghost ->
      case vehicle_or_ghost do
        %Vehicle{end_of_trip_type: :pull_back} -> true
        _ -> false
      end
    end)
  end

  def lookup({table, key}) do
    :ets.lookup_element(table, key, 2)
  rescue
    # :ets.lookup_element/3 exits with :badarg when key is not found
    ArgumentError ->
      []
  end

  # GenServer callbacks

  @impl true
  def init(_opts) do
    ets = :ets.new(__MODULE__, [:set, :protected, {:read_concurrency, true}])

    :timer.send_interval(30_000, self(), :check_data_status)
    :timer.send_interval(60_000, self(), :ghost_stats)

    {:ok, %__MODULE__{ets: ets}}
  end

  # If we get a reply after we've already timed out, ignore it
  @impl true
  def handle_info({reference, _}, %__MODULE__{} = state) when is_reference(reference),
    do: {:noreply, state}

  def handle_info(:check_data_status, %__MODULE__{ets: ets} = state) do
    all_vehicles =
      {ets, :logged_in_vehicles}
      |> lookup()
      |> Enum.filter(fn vehicle_or_ghost -> match?(%Vehicle{}, vehicle_or_ghost) end)

    data_status_fn = Application.get_env(:skate, :data_status_fn, &DataStatus.data_status/1)
    data_status = data_status_fn.(all_vehicles)
    _ = DataStatusPubSub.update(data_status)

    # hibernate periodically to clean up garbage from previous states.
    {:noreply, state, :hibernate}
  end

  def handle_info(:ghost_stats, %__MODULE__{ets: ets} = state) do
    {explained_count, unexplained_count} =
      {ets, :logged_in_vehicles}
      |> lookup()
      |> Enum.filter(&match?(%Ghost{}, &1))
      |> Enum.reduce({0, 0}, fn ghost, {explained_count, unexplained_count} ->
        alias Realtime.BlockWaiver

        if Enum.any?(ghost.block_waivers, &BlockWaiver.current?(&1)) do
          {explained_count + 1, unexplained_count}
        else
          {explained_count, unexplained_count + 1}
        end
      end)

    Logger.info(
      "ghost_stats: explained_count=#{explained_count} unexplained_count=#{unexplained_count}"
    )

    {:noreply, state, :hibernate}
  end

  @impl true
  def handle_call(:subscription_info, _from, %__MODULE__{} = state) do
    {:reply, {pubsub_name(), state.ets}, state}
  end

  def handle_call(:ets, _from, %__MODULE__{ets: ets} = state) do
    # used only by tests
    {:reply, ets, state}
  end

  @impl true
  def handle_cast(
        {:update_vehicles, vehicles_by_route_id, shuttles, logged_out_vehicles},
        %__MODULE__{} = state
      ) do
    new_active_route_ids = Map.keys(vehicles_by_route_id)

    vehicles =
      vehicles_by_route_id
      |> Map.values()
      |> List.flatten()

    new_active_run_ids =
      vehicles
      |> Enum.map(& &1.run_id)
      |> Enum.filter(& &1)

    new_active_block_ids =
      vehicles
      |> Enum.map(& &1.block_id)
      |> Enum.filter(& &1)

    remove_inactive_keys(state, new_active_route_ids, new_active_run_ids, new_active_block_ids)

    _ = update_vehicle_positions(state, vehicles_by_route_id, shuttles, logged_out_vehicles)

    new_state =
      Map.merge(state, %{
        active_route_ids: new_active_route_ids,
        active_run_ids: new_active_run_ids,
        active_block_ids: new_active_block_ids
      })

    _ = broadcast(new_state, :vehicles)

    {:noreply, new_state}
  end

  def handle_cast(
        {:update_alerts, alerts_by_route_id},
        %__MODULE__{active_alert_route_ids: active_alert_route_ids, ets: ets} = state
      ) do
    new_active_route_ids = Map.keys(alerts_by_route_id)

    removed_route_ids = active_alert_route_ids -- new_active_route_ids

    for route_id <- removed_route_ids do
      :ets.delete(ets, {:alerts, route_id})
    end

    Enum.each(alerts_by_route_id, fn {route_id, alerts} ->
      :ets.insert(ets, {{:alerts, route_id}, alerts})
    end)

    _ = broadcast(state, :alerts)

    {:noreply, %{state | active_alert_route_ids: new_active_route_ids}}
  end

  defp remove_inactive_keys(
         %__MODULE__{
           ets: ets,
           active_route_ids: active_route_ids,
           active_run_ids: active_run_ids,
           active_block_ids: active_block_ids
         },
         new_active_route_ids,
         new_active_run_ids,
         new_active_block_ids
       ) do
    removed_route_ids = active_route_ids -- new_active_route_ids
    removed_run_ids = active_run_ids -- new_active_run_ids
    removed_block_ids = active_block_ids -- new_active_block_ids

    for route_id <- removed_route_ids do
      _ = :ets.delete(ets, {:route_id, route_id})
    end

    for run_id <- removed_run_ids do
      _ = :ets.delete(ets, {:run_id, run_id})
    end

    for block_id <- removed_block_ids do
      _ = :ets.delete(ets, {:block_id, block_id})
    end
  end

  defp update_vehicle_positions(
         %__MODULE__{
           ets: ets
         },
         vehicles_by_route_id,
         shuttles,
         logged_out_vehicles
       ) do
    for {route_id, vehicles_and_ghosts} <- vehicles_by_route_id do
      active_vehicles_and_ghosts = Enum.filter(vehicles_and_ghosts, &block_is_active?/1)
      _ = :ets.insert(ets, {{:route_id, route_id}, active_vehicles_and_ghosts})
    end

    logged_in_vehicles =
      vehicles_by_route_id
      |> all_vehicles()
      |> Enum.concat(shuttles)
      |> Enum.uniq_by(& &1.id)

    for vehicle <- logged_in_vehicles do
      _ = :ets.insert(ets, {{:run_id, vehicle.run_id}, vehicle})
      _ = :ets.insert(ets, {{:block_id, vehicle.block_id}, vehicle})
    end

    :ets.insert(ets, {:logged_in_vehicles, logged_in_vehicles})
    :ets.insert(ets, {:logged_out_vehicles, logged_out_vehicles})

    :ets.insert(ets, {:all_shuttles, shuttles})
  end

  @spec all_vehicles(Route.by_id([VehicleOrGhost.t()])) :: [VehicleOrGhost.t()]
  defp all_vehicles(vehicles_by_route_id) do
    Enum.flat_map(
      vehicles_by_route_id,
      fn {route_id, vehicles_and_ghosts} ->
        Enum.filter(vehicles_and_ghosts, fn vehicle_or_ghost ->
          vehicle_or_ghost.route_id == route_id
        end)
      end
    )
  end

  @spec broadcast(t(), :vehicles | :alerts) :: :ok
  defp broadcast(state, data_type) do
    topic =
      case data_type do
        :vehicles -> "realtime_vehicles"
        :alerts -> "realtime_alerts"
      end

    Phoenix.PubSub.broadcast(pubsub_name(), topic, {:new_realtime_data, state.ets})
  end

  @spec block_is_active?(VehicleOrGhost.t()) :: boolean
  defp block_is_active?(%Vehicle{block_is_active: block_is_active}), do: block_is_active
  defp block_is_active?(%Ghost{}), do: true
end
