defmodule Concentrate.Producer.FileTap do
  @moduledoc """
  Logs the fetched file data for later debugging.
  """
  use GenStage

  defmodule State do
    @moduledoc false
    defstruct enabled?: false, demand: 0, bodies: %{}
  end

  alias __MODULE__.State

  def start_link(config) do
    GenStage.start_link(__MODULE__, config, name: __MODULE__)
  end

  def log_body(body, url, date_time) do
    GenStage.cast(__MODULE__, {:log_body, body, url, date_time})
  end

  @impl GenStage
  def init(opts) do
    {:producer, struct!(State, opts)}
  end

  @impl GenStage
  def handle_cast({:log_body, body, url, date_time}, state) do
    if state.enabled? do
      state = put_in(state.bodies[url], {body, date_time})
      maybe_send_events(state)
    else
      {:noreply, [], state}
    end
  end

  @impl GenStage
  def handle_demand(new_demand, state) do
    state = update_in(state.demand, &(&1 + new_demand))
    maybe_send_events(state)
  end

  defp maybe_send_events(state) do
    {bodies, new_bodies} =
      if map_size(state.bodies) <= state.demand do
        {state.bodies, %{}}
      else
        # get the first N keys given by the available demand
        keys = state.bodies |> Map.keys() |> Enum.take(state.demand)
        bodies = Map.take(state.bodies, keys)
        new_bodies = Map.drop(state.bodies, keys)
        {bodies, new_bodies}
      end

    events =
      for {url, {body, date_time}} <- bodies do
        {file_path(url, date_time), body}
      end

    state = %{
      state
      | demand: state.demand - map_size(bodies),
        bodies: new_bodies
    }

    {:noreply, events, state}
  end

  defp file_path(url, date_time) do
    <<year::binary-4, ?-, month::binary-2, ?-, day::binary-2, _::bitstring>> =
      iso_date = DateTime.to_iso8601(date_time)

    year <> "/" <> month <> "/" <> day <> "/" <> iso_date <> "_" <> escape_characters(url)
  end

  defp escape_characters(url) do
    # replace anything that's not a letter, number, or period with "_"
    String.replace(url, ~r/[^.[:alnum:]]/i, "_")
  end
end
