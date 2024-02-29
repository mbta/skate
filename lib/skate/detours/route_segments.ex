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
    defstruct [:before_detour, :detour, :after_detour]
  end

  @doc """
  Break a route shape into segments.

  ## Examples
      iex> alias Util.Location
      iex> Skate.Detours.RouteSegments.route_segments(
      ...>   [Location.new(0, 0), Util.Location.new(0, 1), Util.Location.new(0, 2), Util.Location.new(0, 3)],
      ...>   Util.Location.new(0, 1),
      ...>   Util.Location.new(0, 2)
      ...> )
      {:ok,
        %Skate.Detours.RouteSegments.Result{
          before_detour: [%Util.Location{latitude: 0, longitude: 0}, %Util.Location{latitude: 0, longitude: 1}],
          detour: [%Util.Location{latitude: 0, longitude: 1}, %Util.Location{latitude: 0, longitude: 2}],
          after_detour: [%Util.Location{latitude: 0, longitude: 2}, %Util.Location{latitude: 0, longitude: 3}]
        }}
  """
  @spec route_segments(
          nonempty_list(Util.Location.From.t()),
          Util.Location.From.t(),
          Util.Location.From.t()
        ) :: {:ok, Result.t()} | :error
  def route_segments(
        [],
        _connection_start,
        _connection_end
      ),
      do: :error

  def route_segments(
        shape,
        connection_start,
        connection_end
      ) do
    {_, start_index} =
      shape
      |> Enum.with_index()
      |> Enum.min_by(fn {point, _index} -> Util.Location.distance(point, connection_start) end)

    {_, end_index} =
      shape
      |> Enum.with_index()
      |> Enum.min_by(fn {point, _index} -> Util.Location.distance(point, connection_end) end)

    {:ok,
     %__MODULE__.Result{
       before_detour: Enum.slice(shape, 0..start_index),
       detour: Enum.slice(shape, start_index..end_index),
       after_detour: Enum.slice(shape, end_index..-1)
     }}
  end
end
