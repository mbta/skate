defmodule Realtime.Shape do
  @moduledoc """
  A module that produces GTFS-flavored Realtime Shape structs, primarily to
  be used for detours.

  More info: for https://gtfs.org/realtime/reference/#message-shape
  """

  alias Util.Location
  alias Skate.OpenRouteServiceAPI.DirectionsResponse
  alias Skate.Detours.RouteSegments

  defmodule Input do
    @moduledoc """
    Input for `Realtime.Shape.new/1`.
    """
    @type t :: %__MODULE__{
            shape_id: String.t(),
            route_segments: RouteSegments.Result.t(),
            detour_shape: DirectionsResponse.t()
          }
    @enforce_keys [:shape_id, :route_segments, :detour_shape]
    defstruct [:shape_id, :route_segments, :detour_shape]
  end

  @type t :: %__MODULE__{
          shape_id: String.t(),
          encoded_polyline: String.t()
        }
  @enforce_keys [:shape_id, :encoded_polyline]
  @derive Jason.Encoder
  defstruct [:shape_id, :encoded_polyline]

  @doc """
  A function that takes shape data and detour shape data and encodes it for GTFS.

  ## Example
      iex> Realtime.Shape.new(%Realtime.Shape.Input{
      ...>   shape_id: "the_shape_id",
      ...>   route_segments: %Skate.Detours.RouteSegments.Result{
      ...>     before_detour: [
      ...>       Util.Location.new(42.252, -71.001),
      ...>       Util.Location.new(42.252, -71.002)
      ...>     ],
      ...>     detour: [
      ...>       Util.Location.new(42.252, -71.002),
      ...>       Util.Location.new(42.252, -71.014)
      ...>     ],
      ...>     after_detour: [
      ...>       Util.Location.new(42.252, -71.014),
      ...>       Util.Location.new(42.252, -71.017)
      ...>     ]
      ...>   },
      ...>   detour_shape: %Skate.OpenRouteServiceAPI.DirectionsResponse{
      ...>     coordinates: [
      ...>       %{"lat" => 42.253, "lon" => -71.005},
      ...>       %{"lat" => 42.253, "lon" => -71.008}
      ...>     ]
      ...>   }
      ...> })
      %Realtime.Shape{
        shape_id: "the_shape_id",
        encoded_polyline: "_j{`GfkjpL?fEgEvQ?vQfEnd@?vQ",
      }

  The encoded polyline is somewhat opaque, but notice that it is constructed
  from the coordinates including `detour_shape.coordinates`, and excluding
  `route_segments.detour`.

      iex> Polyline.encode([
      ...>   # route_segments.before_detour
      ...>   {-71.001, 42.252},
      ...>   {-71.002, 42.252},
      ...>
      ...>   # detour_shape.coordinates
      ...>   {-71.005, 42.253},
      ...>   {-71.008, 42.253},
      ...>
      ...>   # route_segments.after_detour
      ...>   {-71.014, 42.252},
      ...>   {-71.017, 42.252}
      ...> ])
      "_j{`GfkjpL?fEgEvQ?vQfEnd@?vQ" # Matches the polyline in the %Shape{...}


      iex> Polyline.encode([
      ...>   # route_segments.before_detour
      ...>   {-71.001, 42.252},
      ...>   {-71.002, 42.252},
      ...>
      ...>   # route_segments.detour
      ...>   {-71.002, 42.252},
      ...>   {-71.014, 42.252},
      ...>
      ...>   # route_segments.after_detour
      ...>   {-71.014, 42.252},
      ...>   {-71.017, 42.252}
      ...> ])
      "_j{`GfkjpL?fE???~iA???vQ" # Does not match the polyline in the %Shape{...}
  """
  def new(%Input{
        shape_id: shape_id,
        route_segments: %RouteSegments.Result{
          before_detour: before_detour,
          after_detour: after_detour
        },
        detour_shape: %DirectionsResponse{coordinates: detour_coordinates}
      }) do
    %__MODULE__{
      shape_id: shape_id,
      encoded_polyline:
        (before_detour ++ detour_coordinates ++ after_detour)
        |> Enum.map(fn
          # The coordinates that come from the route segments are
          # formatted as `Util.Location`'s.
          %Location{latitude: latitude, longitude: longitude} ->
            {longitude, latitude}

          # ...but the coordinates that come from the detour shape, from
          # `OpenRouteServiceAPI`, are formatted as "lat"/"lon" `Map`'s,
          # so we need to handle both cases.
          %{"lat" => latitude, "lon" => longitude} ->
            {longitude, latitude}
        end)
        |> Polyline.encode()
    }
  end
end
