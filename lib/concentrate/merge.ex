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
  alias Concentrate.VehiclePosition
  alias Realtime.Server
  alias Realtime.Vehicle
  alias Realtime.Vehicles

  @type source_tag :: atom()
  @type state :: %__MODULE__{
          tags: %{GenStage.from() => source_tag()},
          latest_data: %{source_tag() => %{String.t() => VehiclePosition.t()} | nil}
        }

  defstruct tags: %{},
            latest_data: %{}

  @type opts :: %{
          name: atom(),
          sources: [source_tag()]
        }
  @start_link_opts [:name]

  def start_link(opts \\ []) do
    start_link_opts = Keyword.take(opts, @start_link_opts)
    opts = Keyword.drop(opts, @start_link_opts)
    GenStage.start_link(__MODULE__, opts, start_link_opts)
  end

  @impl GenStage
  def init(opts) do
    source_tags = Keyword.get(opts, :sources, [])

    state = %__MODULE__{
      tags: %{},
      latest_data:
        source_tags
        |> Enum.map(fn source_tag -> {source_tag, nil} end)
        |> Map.new()
    }

    opts = [
      subscribe_to:
        Enum.map(source_tags, fn source_tag -> {source_tag, [max_demand: 1, tag: source_tag]} end)
    ]

    {:consumer, state, opts}
  end

  @impl GenStage
  def handle_subscribe(:producer, options, from, state) do
    source_tag = Keyword.get(options, :tag)
    state = %{state | tags: Map.put(state.tags, from, source_tag)}
    {:automatic, state}
  end

  def handle_subscribe(_, _, _, state) do
    {:automatic, state}
  end

  @impl GenStage
  def handle_events(events, from, state) do
    source_tag = Map.get(state.tags, from)
    new_data = List.last(events)
    by_id = Map.new(new_data, fn vehicle -> {vehicle.id, vehicle} end)

    latest_data = Map.put(state.latest_data, source_tag, by_id)
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
  @spec group_by_id(%{source_tag() => %{String.t() => VehiclePosition.t()} | nil}) ::
          %{String.t() => %{source_tag() => VehiclePosition.t() | nil}}
  def group_by_id(vehicles_by_source) do
    source_tags = Map.keys(vehicles_by_source)

    vehicle_ids =
      vehicles_by_source
      |> Map.values()
      |> Enum.filter(fn vps -> vps != nil end)
      |> Enum.map(fn vps -> Map.keys(vps) end)
      |> Enum.concat()
      |> Enum.uniq()

    Map.new(vehicle_ids, fn vehicle_id ->
      {vehicle_id,
       Map.new(source_tags, fn source_tag ->
         {source_tag,
          case Map.get(vehicles_by_source, source_tag) do
            nil -> nil
            vps -> Map.get(vps, vehicle_id)
          end}
       end)}
    end)
  end

  @spec vehicles_from_data(%{source_tag() => %{String.t() => VehiclePosition.t()} | nil}) :: [
          Vehicle.t()
        ]
  def vehicles_from_data(vehicles_by_source) do
    vehicles_by_source
    |> group_by_id()
    |> Map.values()
    |> Enum.map(fn sources_for_vehicle -> Vehicle.from_sources(sources_for_vehicle) end)
  end

  @spec update_server([Vehicle.t()]) :: :ok
  def update_server(vehicles) do
    by_route = Vehicles.group_by_route(vehicles)
    shuttles = Enum.filter(vehicles, &Vehicle.shuttle?/1)
    _ = Server.update({by_route, shuttles})
    :ok
  end
end
