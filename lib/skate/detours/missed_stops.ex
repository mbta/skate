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

  defmodule Result do
    @moduledoc false
    @type t :: %__MODULE__{
            missed_stops: [Util.Location.From.t()]
          }
    @enforce_keys [:missed_stops]
    defstruct [:missed_stops]
  end

  @doc """
  Returns the contiguous list of stops, from the input parameter `cfg.stops`.
  """
  @spec missed_stops(cfg :: __MODULE__.t()) :: __MODULE__.Result.t()
  def(
    missed_stops(%__MODULE__{
      stops: stops,
      shape: shape,
      connection_start: connection_start,
      connection_end: connection_end
    })
  ) do
    segmented_shape = segment_shape_by_stops(shape, stops)

    missed_stops =
      {connection_start, connection_end}
      |> missed_segments(segmented_shape)
      |> Enum.map(& &1.stop)

    %__MODULE__.Result{
      missed_stops: missed_stops
    }
  end

  @spec missed_segments(
          {connection_start :: Util.Location.From.t(), connection_end :: Util.Location.From.t()},
          segmented_shape :: [Skate.Detours.ShapeSegment.t()]
        ) :: [Skate.Detours.ShapeSegment.t()]
  defp missed_segments({connection_start, connection_end}, segmented_shape) do
    %{index: start_index} = get_index_by_min_dist(segmented_shape, connection_start)

    remaining_segments = Enum.drop(segmented_shape, start_index)

    %{index: end_count} =
      get_index_by_min_dist(remaining_segments, connection_end)

    Enum.take(remaining_segments, end_count)
  end

  @spec segment_shape_by_stops(
          shape :: [Util.Location.From.t()],
          stops :: [Util.Location.From.t()]
        ) :: [Skate.Detours.ShapeSegment.t()]
  defp segment_shape_by_stops([] = _shape, [] = _stops),
    do: []

  defp segment_shape_by_stops(shape, [] = _stops),
    # If there are no stops, return the shape
    do: [%Skate.Detours.ShapeSegment{points: shape, stop: :none}]

  defp segment_shape_by_stops(shape, stops) do
    # Find the stop closest to the shape
    %{index: anchor_stop_index, shape_dist: %{index: shape_point_anchor_index}} =
      find_stop_closest_to_shape(shape, stops)

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
      (%Skate.Detours.ShapeSegment{stop: :none} = anchor_segment)
      | stop: anchor
    }

    left_segments ++ [anchor_segment] ++ segment_shape_by_stops(right_shape, right_stops)
  end

  @spec find_stop_closest_to_shape(
          shape :: [Util.Location.From.t()],
          stops :: [Util.Location.From.t()]
        ) ::
          %{
            stop: Util.Location.From.t(),
            index: non_neg_integer(),
            shape_dist: point_dist_index()
          }

  defp find_stop_closest_to_shape(shape, stops) do
    stops
    |> Enum.with_index(fn stop, index ->
      %{
        stop: stop,
        index: index,
        shape_dist: closest_point(shape, stop)
      }
    end)
    |> Enum.min_by(fn %{shape_dist: %{dist: dist}} -> dist end)
  end

  @spec get_index_by_min_dist(
          shape_segments :: [Skate.Detours.ShapeSegment.t()],
          reference :: Util.Location.From.t()
        ) ::
          %{
            segment: Skate.Detours.ShapeSegment.t(),
            closest: Util.Location.From.t(),
            index: non_neg_integer()
          }
  defp get_index_by_min_dist(shape_segments, reference) do
    shape_segments
    |> Enum.with_index(fn %Skate.Detours.ShapeSegment{points: points} = segment, idx ->
      %{segment: segment, closest: closest_point(points, reference), index: idx}
    end)
    |> Enum.min_by(fn %{closest: %{dist: dist}} -> dist end)
  end

  @type point_dist_index :: %{
          elem: Util.Location.From.t(),
          dist: float(),
          index: non_neg_integer()
        }
  @spec closest_point(
          coordinates :: [Util.Location.From.t()],
          reference :: Util.Location.From.t()
        ) ::
          point_dist_index()

  defp closest_point(coordinates, reference) do
    reference = Util.Location.as_location!(reference)

    dist_from_reference = fn point ->
      Location.distance(reference, Util.Location.as_location!(point))
    end

    coordinates
    |> Enum.with_index(fn point, idx ->
      %{elem: point, dist: dist_from_reference.(point), index: idx}
    end)
    |> Enum.min_by(& &1.dist)
  end
end
