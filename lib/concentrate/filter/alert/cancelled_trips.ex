defmodule Concentrate.Filter.Alert.CancelledTrips do
  @moduledoc """
  Maintains a table of the currently cancelled trips.
  """
  use GenStage
  require Logger
  alias Concentrate.Filter.Alert.TimeTable
  alias Concentrate.{Alert, Alert.InformedEntity}

  @table __MODULE__
  @empty_value []

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts, name: __MODULE__)
  end

  def route_cancelled?(route_id, date_or_timestamp) when is_binary(route_id) do
    date_overlaps?({:route, route_id}, date_or_timestamp)
  end

  def trip_cancelled?(trip_id, date_or_timestamp) when is_binary(trip_id) do
    date_overlaps?({:trip, trip_id}, date_or_timestamp)
  end

  defp date_overlaps?(key, date_or_timestamp) do
    TimeTable.date_overlaps?(@table, key, date_or_timestamp)
  end

  def init(opts) do
    TimeTable.new(@table)
    {:consumer, [], opts}
  end

  def handle_events(events, _from, state) do
    alerts = List.last(events)

    inserts =
      for alert <- alerts,
          Alert.effect(alert) == :NO_SERVICE,
          entity <- Alert.informed_entity(alert),
          is_nil(InformedEntity.stop_id(entity)),
          key <- cancellation_type(entity),
          {start, stop} <- Alert.active_period(alert) do
        {key, start, stop, @empty_value}
      end

    TimeTable.update(@table, inserts)

    _ =
      Logger.info(fn ->
        "#{__MODULE__} updated: records=#{length(inserts)}"
      end)

    {:noreply, [], state}
  end

  defp cancellation_type(entity) do
    cond do
      is_binary(trip_id = InformedEntity.trip_id(entity)) ->
        [{:trip, trip_id}]

      is_binary(route_id = InformedEntity.route_id(entity)) ->
        [{:route, route_id}]

      true ->
        []
    end
  end
end
