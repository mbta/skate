defmodule Skate.Detours.TripModification do
  @moduledoc """
  A module that produces GTFS-flavored TripModification structs for a detour

  More info: https://gtfs.org/realtime/reference/#message-tripmodifications
  """

  alias Schedule.Gtfs.RoutePattern
  alias Schedule.Gtfs.Stop

  defmodule Input do
    @moduledoc """
    Input for `Skate.Detours.TripModification.for/1`.
    """

    @type t :: %__MODULE__{
            route_pattern: RoutePattern.t(),
            missed_stops: [Stop.t()]
          }

    defstruct [:route_pattern, :missed_stops]
  end

  defmodule SelectedTrip do
    @moduledoc """
    Struct representing the `selected_trips` part of `Skate.Detours.TripModification`.

    More info: https://gtfs.org/realtime/reference/#message-selectedtrips
    """

    @type t :: %__MODULE__{
            trip_ids: [String.t()]
          }

    defstruct [:trip_ids]
  end

  defmodule Modification do
    @moduledoc """
    Struct representing the `modifications` part of `Skate.Detours.TripModification`.

    More info: https://gtfs.org/realtime/reference/#message-modification
    """

    @type t :: %__MODULE__{
            start_stop_selector: String.t(),
            end_stop_selector: String.t()
          }

    defstruct [:start_stop_selector, :end_stop_selector]
  end

  @type t :: %__MODULE__{
          selected_trips: [SelectedTrip.t()],
          modifications: [Modification.t()]
        }
  defstruct [:selected_trips, :modifications]

  @spec for(input :: Input.t()) :: __MODULE__.t()
  @doc """
  A function that takes data about a detour and stitches it together to form a GTFS-flavored
  struct.


  ## Examples
      iex> Skate.Detours.TripModification.for(
      ...>   %Skate.Detours.TripModification.Input{
      ...>     route_pattern: build(:gtfs_route_pattern, representative_trip_id: "01-00"),
      ...>     missed_stops: [
      ...>       build(:gtfs_stop, id: "ABC123"),
      ...>       build(:gtfs_stop, id: "ABC124"),
      ...>       build(:gtfs_stop, id: "ABC129"),
      ...>     ]
      ...>   }
      ...> )
      {:ok,
       %Skate.Detours.TripModification{
         selected_trips: [
           %Skate.Detours.TripModification.SelectedTrip{
             trip_ids: ["01-00"]
           }
         ],
         modifications: [
           %Skate.Detours.TripModification.Modification{
             start_stop_selector: "ABC123",
             end_stop_selector: "ABC129"
           }
         ]
       }}
  """
  def for(%Input{
        route_pattern: %RoutePattern{representative_trip_id: trip_id},
        missed_stops: missed_stops
      }) do
    {:ok,
     %__MODULE__{
       selected_trips: [
         %SelectedTrip{trip_ids: [trip_id]}
       ],
       modifications: [
         %Modification{
           start_stop_selector: missed_stops |> List.first() |> Map.get(:id),
           end_stop_selector: missed_stops |> List.last() |> Map.get(:id)
         }
       ]
     }}
  end
end
