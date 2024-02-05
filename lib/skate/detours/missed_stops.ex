alias Util.Location

defmodule Skate.Detours.MissedStops do
  @moduledoc """
  Processes Shape and Stop data to compute contiguous stops between the
  `connection_start` and `connection_end` parameters.
  """

  @type t :: %__MODULE__{
          connection_start: Util.Location.From.t(),
          connection_end: Util.Location.From.t(),
          stops: nonempty_list(Util.Location.From.t()),
          shape: nonempty_list(Util.Location.From.t())
        }

  @enforce_keys [:connection_start, :connection_end, :stops, :shape]
  defstruct [:connection_start, :connection_end, :stops, :shape]

  @doc """
  Returns the contiguous list of stops, from the input parameter `cfg.stops`.
  """
  @spec missed_stops(cfg :: Skate.Detours.MissedStops.t()) :: [Util.Location.From.t()]
  def missed_stops(%__MODULE__{
        stops: stops,
        shape: shape,
        connection_start: connection_start,
        connection_end: connection_end
      }) do
    segmented_shape = segment_shape_by_stops(shape, stops)

    {connection_start, connection_end}
    |> missed_segments(segmented_shape)
    |> Enum.flat_map(& &1.stops)
  end

  defp missed_segments({connection_start, connection_end}, segmented_shape) do
    %{index: start_index} = get_index_by_min_dist(segmented_shape, connection_start)
    %{index: end_index} = get_index_by_min_dist(segmented_shape, connection_end)

    if start_index == end_index do
      %Skate.Detours.ShapeSegment{
        # As long as there's only one stop in the segment,
        # we can assume that we won't miss any stops
        # because we're rejoining the same segment
        stops: [_]
      } = Enum.at(segmented_shape, start_index)

      []
    else
      # We don't want the stop associated with the segment that the detour rejoins.
      # So subtract one from the end index to ignore that segment
      Enum.slice(segmented_shape, start_index..(end_index - 1))
    end
  end

  defp segment_shape_by_stops([] = _shape, [] = _stops),
    do: []

  defp segment_shape_by_stops(shape, [] = _stops),
    # If there are no stops, return the shape
    do: [%Skate.Detours.ShapeSegment{points: shape, stops: []}]

  defp segment_shape_by_stops(shape, stops) do
    # Find the stop closest to the shape
    [%{index: anchor_stop_index, shape_dist: [%{index: shape_point_anchor_index} | _]} | _] =
      sort_stops_by_dist_to_shape(shape, stops)

    # Split the shape and stops at the anchor point
    # Add one to the Shape Point Anchor Index so that the point ends up in `left_shape`
    {left_shape, right_shape} = Enum.split(shape, shape_point_anchor_index + 1)

    {left_stops, [anchor | right_stops]} = Enum.split(stops, anchor_stop_index)

    # Process `left_shape` into segments
    {left_segments, [anchor_segment]} =
      Enum.split(segment_shape_by_stops(left_shape, left_stops), -1)

    # Take last segment, which should not have a stop,
    # and reconnect it with the anchor stop
    anchor_segment = %Skate.Detours.ShapeSegment{
      (%Skate.Detours.ShapeSegment{stops: []} = anchor_segment)
      | stops: [anchor]
    }

    left_segments ++ [anchor_segment] ++ segment_shape_by_stops(right_shape, right_stops)
  end

  defp sort_stops_by_dist_to_shape(shape, stops) do
    stops
    |> Enum.with_index(fn stop, index ->
      %{
        stop: stop,
        index: index,
        shape_dist: sort_by_distance(shape, stop)
      }
    end)
    |> Enum.sort_by(fn %{shape_dist: [%{dist: dist} | _]} -> dist end)
  end

  defp get_index_by_min_dist(shape_segments, reference) do
    shape_segments
    |> Enum.with_index(fn %Skate.Detours.ShapeSegment{points: points} = segment, idx ->
      points = sort_by_distance(points, reference)
      # Pick closest points within fuzzy_dist=(0)
      # Discard adjacent points
      # Pick highest rank or return :indeterminate
      %{segment: segment, sorted_points: points, index: idx}
    end)
    |> Enum.min_by(fn %{sorted_points: [%{dist: dist} | _]} -> dist end)
  end

  defp sort_by_distance(coordinates, reference) do
    reference = Util.Location.as_location!(reference)

    dist_from_reference = fn point ->
      Location.distance(reference, Util.Location.as_location!(point))
    end

    coordinates
    |> Enum.with_index(fn point, idx ->
      %{point: point, dist: dist_from_reference.(point), index: idx}
    end)
    |> Enum.sort_by(
      & &1.dist,
      :asc
    )
  end
end
