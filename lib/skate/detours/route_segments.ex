defmodule Skate.Detours.RouteSegments do
  @moduledoc """
  Break a route into segments based on `connection_start` and `connection_end` points
  """
  alias Util.NearestPoint

  defmodule UnfinishedResult do
    @moduledoc false
    @type t :: %__MODULE__{
            before_start_point: [Util.Location.From.t()],
            after_start_point: [Util.Location.From.t()]
          }
    @enforce_keys [:before_start_point, :after_start_point]
    @derive {Jason.Encoder, only: [:before_start_point, :after_start_point]}
    defstruct [:before_start_point, :after_start_point]
  end

  defmodule Result do
    @moduledoc false
    @type t :: %__MODULE__{
            before_detour: [Util.Location.From.t()],
            detour: [Util.Location.From.t()],
            after_detour: [Util.Location.From.t()]
          }
    @enforce_keys [:before_detour, :detour, :after_detour]
    @derive {Jason.Encoder, only: [:before_detour, :detour, :after_detour]}
    defstruct [:before_detour, :detour, :after_detour]
  end

  @spec unfinished_route_segments(
          nonempty_list(Util.Location.From.t()),
          Util.Location.From.t()
        ) :: {:ok, UnfinishedResult.t()}
  def unfinished_route_segments([], _start_point), do: :error
  def unfinished_route_segments([_], _start_point), do: :error

  def unfinished_route_segments(
        shape,
        start_point
      ) do
    {before_start_point, after_start_point} = split_shape_at_point(shape, start_point)

    {:ok,
     %__MODULE__.UnfinishedResult{
       before_start_point: before_start_point,
       after_start_point: after_start_point
     }}
  end

  @doc """
  Break a completed detour's route shape into segments based on its start and end points.

  ## Examples
      iex> alias Util.Location
      iex> Skate.Detours.RouteSegments.route_segments(
      ...>   [
      ...>     Location.new(0.0, 0.0),
      ...>     Location.new(0.0, 1.0),
      ...>     Location.new(0.0, 2.0),
      ...>     Location.new(0.0, 3.0)
      ...>   ],
      ...>   Location.new(0.0, 1.3),
      ...>   Location.new(0.0, 2.6)
      ...> )
      {:ok,
        %Skate.Detours.RouteSegments.Result{
          before_detour: [
            %Util.Location{latitude: 0.0, longitude: 0.0},
            %Util.Location{latitude: 0.0, longitude: 1.0},
            %Util.Location{latitude: 0.0, longitude: 1.3}
          ],
          detour: [
            %Util.Location{latitude: 0.0, longitude: 1.3},
            %Util.Location{latitude: 0.0, longitude: 2.0},
            %Util.Location{latitude: 0.0, longitude: 2.6}
          ],
          after_detour: [
            %Util.Location{latitude: 0.0, longitude: 2.6},
            %Util.Location{latitude: 0.0, longitude: 3.0}
          ]
        }}
  """
  @spec route_segments(
          nonempty_list(Util.Location.From.t()),
          Util.Location.From.t(),
          Util.Location.From.t()
        ) :: {:ok, Result.t()} | :error
  def route_segments([], _connection_start, _connection_end), do: :error
  def route_segments([_], _connection_start, _connection_end), do: :error

  def route_segments(
        shape,
        connection_start,
        connection_end
      ) do
    {before_start_point, after_start_point} = split_shape_at_point(shape, connection_start)
    {between_points, after_end_point} = split_shape_at_point(after_start_point, connection_end)

    {:ok,
     %__MODULE__.Result{
       before_detour: before_start_point,
       detour: between_points,
       after_detour: after_end_point
     }}
  end

  @spec split_shape_at_point(nonempty_list(Util.Location.From.t()), Util.Location.From.t()) :: {
          nonempty_list(Util.Location.From.t()),
          nonempty_list(Util.Location.From.t())
        }
  defp split_shape_at_point(shape, point) do
    {nearest_point, index} = NearestPoint.nearest_point_on_shape(shape, point)
    {shape_before_point, shape_after_point} = Enum.split(shape, index + 1)

    {before_point, after_point} =
      {shape_before_point ++ [nearest_point], [nearest_point | shape_after_point]}

    {before_point, after_point}
  end
end
