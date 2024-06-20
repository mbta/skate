defmodule Skate.Detours.TripModification do
  @moduledoc """
  A module that produces TripModification structs for a detour
  """
  alias Schedule.Gtfs.RoutePattern

  defstruct [:selected_trips, :modifications]

  defmodule Input do
    @moduledoc false
    defstruct [:route_pattern, :missed_stops]
  end

  defmodule SelectedTrip do
    @moduledoc false
    defstruct [:trip_ids]
  end

  defmodule Modification do
    @moduledoc false
    defstruct [:start_stop_selector, :end_stop_selector]
  end

  def for(%Input{
        route_pattern: %RoutePattern{representative_trip_id: trip_id},
        missed_stops: missed_stops
      }) do
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
    }
  end
end
