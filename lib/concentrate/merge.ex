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
  alias Concentrate.Mergeable
  alias Concentrate.VehiclePosition

  @type source_tag :: atom()
  @type state :: %__MODULE__{
    tags: %{GenStage.from() => source_tag()},
    latest_data: %{source_tag() => [VehiclePosition.t()] | nil}
  }

  defstruct [
    tags: %{},
    latest_data: %{}
  ]

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

    opts = [ subscribe_to: Enum.map( source_tags, fn source_tag -> {source_tag, [ max_demand: 1, tag: source_tag ]} end) ]

    {:producer_consumer, state, opts}
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

    latest_data = Map.put(state.latest_data, source_tag, new_data)
    state = %{ state | latest_data: latest_data }

    merge = &Mergeable.impl_for!(%VehiclePosition{}).merge/2

    merged_vehicle_positions =
      latest_data
      |> Map.values()
      |> Enum.filter(fn vps -> vps != nil end)
      |> Enum.concat()
      |> Enum.group_by(fn vp -> vp.id end)
      |> Enum.map(fn {_id, vps} -> Enum.reduce(vps, merge) end)

    {:noreply, [merged_vehicle_positions], state}
  end
end
