defmodule Skate.Detours.RouteSegments do
  @moduledoc """
  Break a route into segments based on `onnection_start` and `connection_end` points
  """

  defmodule Params do
    @moduledoc false
    @type t :: %__MODULE__{
            connection_start: Util.Location.From.t(),
            connection_end: Util.Location.From.t(),
            shape: nonempty_list(Util.Location.From.t())
          }
    @enforce_keys [:connection_start, :connection_end, :shape]
    defstruct [:connection_start, :connection_end, :shape]
  end

  defmodule Result do
    @moduledoc false
    @type t :: %__MODULE__{
            before_detour: [Util.Location.From.t()],
            detour: [Util.Location.From.t()],
            after_detour: [Util.Location.From.t()]
          }
    @enforce_keys [:before_detour, :detour, :after_detour]
    defstruct [:before_detour, :detour, :after_detour]
  end

  @doc """
  Break a route shape into segments.

  ## Examples
      iex> alias Util.Location
      iex> Skate.Detours.RouteSegments.route_segments(
      ...>   %Skate.Detours.RouteSegments.Params{
      ...>     shape: [Location.new(0, 0), Util.Location.new(0, 1), Util.Location.new(0, 2), Util.Location.new(0, 3)],
      ...>     connection_start: Util.Location.new(0, 1),
      ...>     connection_end: Util.Location.new(0, 2)
      ...>   }
      ...> )
      %Skate.Detours.RouteSegments.Result{
        before_detour: [%Util.Location{latitude: 0, longitude: 0}, %Util.Location{latitude: 0, longitude: 1}],
        detour: [%Util.Location{latitude: 0, longitude: 1}, %Util.Location{latitude: 0, longitude: 2}],
        after_detour: [%Util.Location{latitude: 0, longitude: 2}, %Util.Location{latitude: 0, longitude: 3}]
      }
  """
  @spec route_segments(Params.t()) :: Result.t()
  def route_segments(%__MODULE__.Params{
        connection_start: connection_start,
        connection_end: connection_end,
        shape: shape
      }) do
    {_, start_index} =
      shape
      |> Enum.with_index()
      |> Enum.min_by(fn {point, _index} -> Util.Location.distance(point, connection_start) end)

    {_, end_index} =
      shape
      |> Enum.with_index()
      |> Enum.min_by(fn {point, _index} -> Util.Location.distance(point, connection_end) end)

    %__MODULE__.Result{
      before_detour: Enum.slice(shape, 0..start_index),
      detour: Enum.slice(shape, start_index..end_index),
      after_detour: Enum.slice(shape, end_index..-1)
    }
  end
end
