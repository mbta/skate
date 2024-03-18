defmodule Skate.Detours.RouteSegments do
  @moduledoc """
  Break a route into segments based on `connection_start` and `connection_end` points
  """

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

  @doc """
  Break a route shape into segments.

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
    {nearest_start_point, start_index} =
      nearest_point_to_shape(shape, connection_start)

    {nearest_end_point, end_index} =
      nearest_point_to_shape(shape, connection_end)

    {:ok,
     %__MODULE__.Result{
       before_detour: Enum.slice(shape, 0..start_index) ++ [nearest_start_point],
       detour:
         [nearest_start_point] ++
           Enum.slice(shape, (start_index + 1)..end_index) ++ [nearest_end_point],
       after_detour: [nearest_end_point] ++ Enum.slice(shape, (end_index + 1)..-1)
     }}
  end

  defp nearest_point_to_shape(shape, point) do
    {%{nearest_point: nearest_point}, index} =
      shape
      |> Enum.chunk_every(2, 1, :discard)
      |> Enum.map(fn segment -> Util.Location.nearest_point_to_segment(point, segment) end)
      |> Enum.map(fn nearest_point ->
        %{nearest_point: nearest_point, distance: Util.Location.distance(nearest_point, point)}
      end)
      |> Enum.with_index()
      |> Enum.min_by(fn {%{distance: distance}, _} -> distance end)

    {nearest_point, index}
  end
end
