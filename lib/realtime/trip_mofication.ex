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

    @type t :: %__MODULE__{
            route_pattern: RoutePattern.t(),
            missed_stops: [Stop.t()],
            service_date: Date.t(),
            last_modified_time: DateTime.t()
          }

    @enforce_keys [:route_pattern, :missed_stops, :service_date, :last_modified_time]
    defstruct [:route_pattern, :missed_stops, :service_date, :last_modified_time]
  end

  defmodule SelectedTrip do
    @moduledoc """
    Struct representing the `selected_trips` field of `Realtime.TripModification`.

    More info: https://gtfs.org/realtime/reference/#message-selectedtrips
    """

    @type t :: %__MODULE__{
            trip_ids: [String.t()]
          }

    @enforce_keys [:trip_ids]
    defstruct [:trip_ids]
  end

  defmodule Modification do
    @moduledoc """
    Struct representing the `modifications` field of `Realtime.TripModification`.

    More info: https://gtfs.org/realtime/reference/#message-modification
    """

    @type t :: %__MODULE__{
            start_stop_selector: String.t(),
            end_stop_selector: String.t(),
            last_modified_time: DateTime.t()
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

  ## Examples
      iex> Realtime.TripModification.new(
      ...>   %Realtime.TripModification.Input{
      ...>     route_pattern: build(:gtfs_route_pattern, representative_trip_id: "01-00"),
      ...>     missed_stops: [
      ...>       build(:gtfs_stop, id: "ABC123"),
      ...>       build(:gtfs_stop, id: "ABC124"),
      ...>       build(:gtfs_stop, id: "ABC129"),
      ...>     ],
      ...>     service_date: ~D[2024-06-20],
      ...>     last_modified_time: ~U[2024-06-18 12:00:00Z]
      ...>   }
      ...> )
      {:ok,
       %Realtime.TripModification{
         selected_trips: [
           %Realtime.TripModification.SelectedTrip{
             trip_ids: ["01-00"]
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
             last_modified_time: ~U[2024-06-18 12:00:00Z]
           }
         ]
       }}
  """
  def new(%Input{
        route_pattern: %RoutePattern{representative_trip_id: trip_id},
        missed_stops: missed_stops,
        service_date: service_date,
        last_modified_time: last_modified_time
      }) do
    {:ok,
     %__MODULE__{
       selected_trips: [
         %SelectedTrip{trip_ids: [trip_id]}
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
           last_modified_time: last_modified_time
         }
       ]
     }}
  end
end
