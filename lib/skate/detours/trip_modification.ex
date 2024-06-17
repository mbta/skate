defmodule Skate.Detours.TripModification do
  @moduledoc """
  A module that produces TripModification structs for a detour
  """
  alias Schedule.Gtfs.RoutePattern

  defstruct [:selected_trips]

  defmodule Input do
    @moduledoc false
    defstruct [:route_pattern]
  end

  defmodule SelectedTrip do
    @moduledoc false
    defstruct [:trip_ids]
  end

  def for(%Input{route_pattern: %RoutePattern{representative_trip_id: trip_id}}) do
    %__MODULE__{
      selected_trips: [
        %SelectedTrip{trip_ids: [trip_id]}
      ]
    }
  end
end
