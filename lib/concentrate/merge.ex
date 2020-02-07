defmodule Concentrate.Merge do
  @moduledoc """
  Consumer
  Gets data from multiple different sources,
  And then merges it into Vehicles

  We save the last result from each producer.
  Whenever a producer produces, do the merge using the latest data from every source
  """
  use GenStage
  require Logger
  alias Realtime.Server
  alias Realtime.Vehicle
  alias Realtime.Vehicles

  @type source_id :: :busloc | :swiftly
  @type latest_data() :: %{
          busloc: %{String.t() => Busloc.t()} | nil,
          swiftly: %{String.t() => Swiftly.t()} | nil
        }

  @type state :: %__MODULE__{
          tags: %{GenStage.from() => source_id()},
          latest_data: latest_data()
        }

  defstruct tags: %{},
            latest_data: %{
              busloc: nil,
              swiftly: nil
            }

  @type opts :: %{
          name: atom(),
          sources: [source_id()]
        }
  @start_link_opts [:name]

  def start_link(opts \\ []) do
    start_link_opts = Keyword.take(opts, @start_link_opts)
    opts = Keyword.drop(opts, @start_link_opts)
    GenStage.start_link(__MODULE__, opts, start_link_opts)
  end

  @impl GenStage
  def init(opts) do
    source_ids = Keyword.get(opts, :sources, [])

    state = %__MODULE__{
      tags: %{},
      latest_data: %{
        busloc: nil,
        swiftly: nil
      }
    }

    opts = [
      subscribe_to:
        Enum.map(source_ids, fn source_id -> {source_id, [max_demand: 1, tag: source_id]} end)
    ]

    {:consumer, state, opts}
  end

  @impl GenStage
  def handle_subscribe(:producer, options, from, state) do
    source_id = Keyword.get(options, :tag)
    state = %{state | tags: Map.put(state.tags, from, source_id)}
    {:automatic, state}
  end

  def handle_subscribe(_, _, _, state) do
    {:automatic, state}
  end

  @impl GenStage
  def handle_events(events, from, state) do
    source_id = Map.get(state.tags, from)
    new_data = List.last(events)

    by_id =
      case source_id do
        :busloc ->
          Map.new(new_data, fn vehicle -> {vehicle.id, vehicle} end)

        :swiftly ->
          Map.new(new_data, fn vehicle -> {vehicle.id, vehicle} end)
      end

    latest_data = Map.put(state.latest_data, source_id, by_id)
    state = %{state | latest_data: latest_data}

    _ =
      latest_data
      |> vehicles_from_data()
      |> update_server()

    {:noreply, [], state}
  end

  @doc """
  Flips the dicts.
  Goes from each source having its vehicles,
  To each vehicle id having its sources.
  """
  @spec group_by_id(%{source_id() => %{String.t() => term()} | nil}) ::
          %{String.t() => %{source_id() => term() | nil}}
  def group_by_id(vehicles_by_source) do
    source_ids = Map.keys(vehicles_by_source)

    vehicle_ids =
      vehicles_by_source
      |> Map.values()
      |> Enum.filter(fn vps -> vps != nil end)
      |> Enum.map(fn vps -> Map.keys(vps) end)
      |> Enum.concat()
      |> Enum.uniq()

    Map.new(vehicle_ids, fn vehicle_id ->
      {vehicle_id,
       Map.new(source_ids, fn source_id ->
         {source_id,
          case Map.get(vehicles_by_source, source_id) do
            nil -> nil
            vps -> Map.get(vps, vehicle_id)
          end}
       end)}
    end)
  end

  @spec vehicles_from_data(latest_data()) :: [Vehicle.t()]
  def vehicles_from_data(latest_data) do
    %{
      busloc: latest_data.busloc,
      swiftly: latest_data.swiftly
    }
    |> group_by_id()
    |> Map.values()
    |> Enum.map(fn sources_for_vehicle ->
      Vehicle.from_sources(
        sources_for_vehicle[:busloc],
        sources_for_vehicle[:swiftly]
      )
    end)
  end

  @spec update_server([Vehicle.t()]) :: :ok
  def update_server(vehicles) do
    by_route = Vehicles.group_by_route(vehicles)
    shuttles = Enum.filter(vehicles, &Vehicle.shuttle?/1)
    _ = Server.update({by_route, shuttles})
    :ok
  end
end
