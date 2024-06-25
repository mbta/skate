defmodule Realtime.TripModification do
  @moduledoc """
  A module that produces GTFS-flavored TripModification structs for a detour

  More info: https://gtfs.org/realtime/reference/#message-tripmodifications
  """

  alias Schedule.Gtfs.RoutePattern
  alias Schedule.Gtfs.Stop

  defmodule Input do
    @moduledoc """
    Input for `Realtime.TripModification.new/1`.
    """
    alias Schedule.ShapeWithStops

    @type t :: %__MODULE__{
            route_pattern: RoutePattern.t(),
            missed_stops: [Stop.t()],
            shape_with_stops: ShapeWithStops.t(),
            service_date: Date.t(),
            last_modified_time: DateTime.t()
          }

    @enforce_keys [
      :route_pattern,
      :missed_stops,
      :shape_with_stops,
      :service_date,
      :last_modified_time
    ]
    defstruct [
      :route_pattern,
      :missed_stops,
      :shape_with_stops,
      :service_date,
      :last_modified_time
    ]
  end

  defmodule SelectedTrip do
    @moduledoc """
    Struct representing the `selected_trips` field of `Realtime.TripModification`.

    More info: https://gtfs.org/realtime/reference/#message-selectedtrips
    """

    @type t :: %__MODULE__{
            trip_ids: [String.t()],
            shape_id: String.t()
          }

    @enforce_keys [:trip_ids, :shape_id]
    defstruct [:trip_ids, :shape_id]
  end

  defmodule Modification do
    @moduledoc """
    Struct representing the `modifications` field of `Realtime.TripModification`.

    More info: https://gtfs.org/realtime/reference/#message-modification
    """

    @type t :: %__MODULE__{
            start_stop_selector: String.t(),
            end_stop_selector: String.t(),
            last_modified_time: integer()
          }

    @enforce_keys [:start_stop_selector, :end_stop_selector, :last_modified_time]
    defstruct [:start_stop_selector, :end_stop_selector, :last_modified_time]
  end

  defmodule StopSelector do
    @moduledoc """
    Struct representing the two `stop_selector` fields of `Realtime.TripModification.Modification`.

    More info: https://gtfs.org/realtime/reference/#message-stopselector
    """

    @type t :: %__MODULE__{
            stop_id: String.t()
          }

    defstruct [:stop_id]
  end

  @type t :: %__MODULE__{
          selected_trips: [SelectedTrip.t()],
          service_dates: [String.t()],
          modifications: [Modification.t()]
        }
  @enforce_keys [:selected_trips, :service_dates, :modifications]
  defstruct [:selected_trips, :service_dates, :modifications]

  @spec new(input :: Input.t()) :: {:ok, __MODULE__.t()}
  @doc """
  A function that takes data about a detour and stitches it together to form a GTFS-flavored
  struct.

  ## Example
      iex> Realtime.TripModification.new(
      ...>   %Realtime.TripModification.Input{
      ...>     route_pattern: build(:gtfs_route_pattern, representative_trip_id: "01-00"),
      ...>     missed_stops: [
      ...>       build(:gtfs_stop, id: "ABC123"),
      ...>       build(:gtfs_stop, id: "ABC124"),
      ...>       build(:gtfs_stop, id: "ABC129")
      ...>     ],
      ...>     shape_with_stops: build(:shape_with_stops,
      ...>       id: "010128",
      ...>       stops: build_list(5, :gtfs_stop)
      ...>     ),
      ...>     service_date: ~D[2024-06-20],
      ...>     last_modified_time: ~U[2024-06-18 12:00:00Z]
      ...>   }
      ...> )
      {:ok,
       %Realtime.TripModification{
         selected_trips: [
           %Realtime.TripModification.SelectedTrip{
             trip_ids: ["01-00"],
             shape_id: "010128"
           }
         ],
         service_dates: ["20240620"],
         modifications: [
           %Realtime.TripModification.Modification{
             start_stop_selector: %TripModification.StopSelector{
               stop_id: "ABC123",
             },
             end_stop_selector: %TripModification.StopSelector{
               stop_id: "ABC129"
             },
             last_modified_time: 1718712000
           }
         ]
       }}

  If there are any duplicate stops, `new/1` will return an error, since using stop_id's as
  stop selectors isn't valid when the trip in question visits the same stop twice.

  ## Example
      iex> Realtime.TripModification.new(
      ...>   %Realtime.TripModification.Input{
      ...>     route_pattern: build(:gtfs_route_pattern, representative_trip_id: "01-00"),
      ...>     missed_stops: [
      ...>       build(:gtfs_stop),
      ...>       build(:gtfs_stop),
      ...>       build(:gtfs_stop),
      ...>     ],
      ...>     shape_with_stops: build(:shape_with_stops,
      ...>       id: "010128",
      ...>       stops: [
      ...>         build(:gtfs_stop),
      ...>         build(:gtfs_stop, id: "duplicate_stop_id"),
      ...>         build(:gtfs_stop),
      ...>         build(:gtfs_stop, id: "duplicate_stop_id"),
      ...>         build(:gtfs_stop),
      ...>         build(:gtfs_stop),
      ...>       ]
      ...>     ),
      ...>     service_date: ~D[2024-06-20],
      ...>     last_modified_time: ~U[2024-06-18 12:00:00Z]
      ...>   }
      ...> )
      {:error, :duplicate_stops_in_shape}
  """
  def new(%Input{
        route_pattern: %RoutePattern{representative_trip_id: trip_id},
        missed_stops: missed_stops,
        shape_with_stops:
          shape_with_stops = %Schedule.ShapeWithStops{stops: original_shape_stops},
        service_date: service_date,
        last_modified_time: last_modified_time
      }) do
    has_duplicate_stops =
      original_shape_stops
      |> Enum.group_by(fn %Schedule.Gtfs.Stop{id: id} -> id end)
      |> Enum.any?(fn {_, stops_for_id} -> Enum.count(stops_for_id) > 1 end)

    case has_duplicate_stops do
      true ->
        {:error, :duplicate_stops_in_shape}

      false ->
        {:ok,
         %__MODULE__{
           selected_trips: [
             %SelectedTrip{trip_ids: [trip_id], shape_id: shape_with_stops.id}
           ],
           service_dates: [Date.to_iso8601(service_date, :basic)],
           modifications: [
             %Modification{
               start_stop_selector: %StopSelector{
                 stop_id: missed_stops |> List.first() |> Map.get(:id)
               },
               end_stop_selector: %StopSelector{
                 stop_id: missed_stops |> List.last() |> Map.get(:id)
               },
               last_modified_time: DateTime.to_unix(last_modified_time)
             }
           ]
         }}
    end
  end
end
