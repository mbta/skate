alias Util.Location

defmodule Skate.Detours.MissedStops do
  @moduledoc """
  Processes Shape and Stop data to compute contiguous stops between the
  `connection_start` and `connection_end` parameters.
  """
  alias Util.NearestPoint

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
            missed_stops: [Util.Location.From.t()],
            connection_stop_start: Util.Location.From.t() | nil,
            connection_stop_end: Util.Location.From.t() | nil
          }
    @enforce_keys [:missed_stops, :connection_stop_start, :connection_stop_end]
    defstruct [:missed_stops, :connection_stop_start, :connection_stop_end]
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

    %{
      missed_stops: missed_stops,
      connection_start_segment: connection_start_segment,
      connection_end_segment: connection_end_segment
    } =
      missed_segments({connection_start, connection_end}, segmented_shape)

    %__MODULE__.Result{
      missed_stops: Enum.map(missed_stops, & &1.stop),
      connection_stop_start:
        case connection_start_segment do
          %Skate.Detours.ShapeSegment{stop: stop} when stop != :none -> stop
          _ -> nil
        end,
      connection_stop_end:
        case connection_end_segment do
          %Skate.Detours.ShapeSegment{stop: stop} when stop != :none -> stop
          _ -> nil
        end
    }
  end

  @spec missed_segments(
          {connection_start :: Util.Location.From.t(), connection_end :: Util.Location.From.t()},
          segmented_shape :: [Skate.Detours.ShapeSegment.t()]
        ) :: %{
          missed_stops: [Skate.Detours.ShapeSegment.t()],
          connection_start_segment: Skate.Detours.ShapeSegment.t() | nil,
          connection_end_segment: Skate.Detours.ShapeSegment.t() | nil
        }
  defp missed_segments({connection_start, connection_end}, segmented_shape) do
    start_index = get_index_by_min_dist(segmented_shape, connection_start)

    {first_segments, remaining_segments} = Enum.split(segmented_shape, start_index)

    end_count = get_index_by_min_dist(remaining_segments, connection_end)

    {missed_stop_segments, end_segments} = Enum.split(remaining_segments, end_count)

    %{
      missed_stops: missed_stop_segments,
      connection_start_segment: List.last(first_segments),
      connection_end_segment: List.first(end_segments)
    }
  end

  @spec segment_shape_by_stops(
          shape :: [Util.Location.From.t()],
          stops :: [Util.Location.From.t()]
        ) :: [Skate.Detours.ShapeSegment.t()]
  def segment_shape_by_stops([] = _shape, [] = _stops),
    do: []

  def segment_shape_by_stops(shape, [] = _stops),
    # If there are no stops, return the shape
    do: [%Skate.Detours.ShapeSegment{points: shape, stop: :none}]

  def segment_shape_by_stops(shape, stops) do
    %{stop_index: anchor_stop_index, anchor_point: anchor_point, shape_index: anchor_shape_index} =
      stops
      |> Enum.with_index(fn stop, stop_index ->
        {anchor_point, shape_index} = NearestPoint.nearest_point_on_shape(shape, stop)

        %{
          stop: stop,
          stop_index: stop_index,
          anchor_point: anchor_point,
          shape_index: shape_index,
          dist: Location.distance(anchor_point, stop)
        }
      end)
      |> Enum.min_by(fn %{dist: dist} -> dist end)

    {stops_before_anchor, [anchor_stop | stops_after_anchor]} =
      Enum.split(stops, anchor_stop_index)

    {points_before_anchor, points_after_anchor} = Enum.split(shape, anchor_shape_index + 1)

    shape_before_anchor = points_before_anchor ++ [anchor_point]
    shape_after_anchor = [anchor_point] ++ points_after_anchor

    {segments_before_anchor, [incomplete_anchor_segment]} =
      segment_shape_by_stops(shape_before_anchor, stops_before_anchor) |> Enum.split(-1)

    anchor_segment = %Skate.Detours.ShapeSegment{incomplete_anchor_segment | stop: anchor_stop}

    segments_after_anchor = segment_shape_by_stops(shape_after_anchor, stops_after_anchor)

    segments_before_anchor ++
      [anchor_segment] ++
      segments_after_anchor
  end

  @spec get_index_by_min_dist(
          shape_segments :: [Skate.Detours.ShapeSegment.t()],
          reference :: Util.Location.From.t()
        ) :: non_neg_integer()
  defp get_index_by_min_dist(shape_segments, reference) do
    shape_segments
    |> Enum.with_index(fn %Skate.Detours.ShapeSegment{points: points} = segment, idx ->
      %{segment: segment, closest: closest_point(points, reference), index: idx}
    end)
    |> Enum.min_by(fn %{closest: %{dist: dist}} -> dist end)
    |> Map.fetch!(:index)
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
