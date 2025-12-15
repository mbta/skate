defmodule Skate.Detours.Detour do
  @moduledoc """
  Modules for different detour structures that can be read from the db
  """

  alias Schedule.Gtfs.RoutePattern
  require Logger

  defmodule Simple do
    @moduledoc """
    Simple detours have had the db detour state parsed into attributes
    """
    @type t :: %__MODULE__{
            id: integer(),
            route: String.t(),
            via_variant: String.t(),
            direction: String.t(),
            name: String.t(),
            intersection: String.t(),
            updated_at: integer(),
            author_id: integer(),
            status: :active | :draft | :past,
            activated_at: DateTime.t() | nil,
            estimated_duration: String.t() | nil
          }

    @derive Jason.Encoder

    defstruct [
      :id,
      :route,
      :via_variant,
      :direction,
      :name,
      :intersection,
      :updated_at,
      :author_id,
      :status,
      :activated_at,
      :estimated_duration
    ]

    def from(
          :active,
          %{
            status: :active,
            activated_at: activated_at,
            estimated_duration: estimated_duration,
            state: state
          } = db_detour
        ) do
      if activated_at == nil || estimated_duration == nil do
        selected_duration = state["context"]["selectedDuration"]

        Logger.warning(
          "active_detour_missing_info id=#{db_detour.id} activated_at=#{inspect(activated_at)} estimated_duration=#{inspect(estimated_duration)} selected_duration=#{selected_duration}"
        )
      end

      simple_detour = extract_from_attributes(db_detour)

      %__MODULE__{
        simple_detour
        | activated_at: activated_at || DateTime.utc_now(),
          estimated_duration: estimated_duration || "Until further notice"
      }
    end

    def from(
          _status,
          %{
            id: id,
            status: status,
            state: %{
              "context" => %{
                "route" => %{"name" => route_name, "directionNames" => direction_names},
                "routePattern" => %{
                  "headsign" => headsign,
                  "directionId" => direction_id
                },
                "nearestIntersection" => nearest_intersection
              }
            },
            updated_at: updated_at
          } = db_detour
        ) do
      direction = Map.get(direction_names, Integer.to_string(direction_id))

      %__MODULE__{
        id: id,
        route: route_name,
        via_variant: RoutePattern.via_variant(route_pattern_id),
        direction: direction,
        name: headsign,
        intersection: nearest_intersection,
        updated_at: timestamp_to_unix(updated_at),
        author_id: db_detour.author_id,
        status: status
      }
    end

    def from(
          _status,
          %{
            id: _id,
            author_id: _author_id,
            updated_at: _updated_at,
            route_name: _route_name,
            headsign: _headsign,
            nearest_intersection: _nearest_intersection,
            direction: _direction,
            estimated_duration: _estimated_duration,
            activated_at: _activated_at,
            status: _db_status
          } = db_detour
        ) do
      extract_from_attributes(db_detour)
    end

    defp extract_from_attributes(%{
           id: id,
           author_id: author_id,
           updated_at: updated_at,
           route_pattern_id: route_pattern_id,
           route_name: route_name,
           headsign: headsign,
           nearest_intersection: nearest_intersection,
           direction: direction,
           estimated_duration: estimated_duration,
           activated_at: activated_at,
           status: status
         }) do
      %__MODULE__{
        id: id,
        route: route_name,
        via_variant: route_pattern_id && RoutePattern.via_variant(route_pattern_id),
        direction: direction,
        name: headsign,
        intersection: nearest_intersection,
        updated_at: timestamp_to_unix(updated_at),
        author_id: author_id,
        estimated_duration: estimated_duration,
        activated_at: activated_at,
        status: status
      }
    end

    # Converts the db timestamp to unix
    defp timestamp_to_unix(db_date) do
      db_date
      |> DateTime.from_naive!("Etc/UTC")
      |> DateTime.to_unix()
    end
  end

  defmodule WithState do
    @moduledoc """
    Detours WithState have had their state left intact
    """
    @type t :: %__MODULE__{
            author: String.t(),
            state: map(),
            updated_at: integer()
          }

    @derive Jason.Encoder

    defstruct [
      :author,
      :state,
      :updated_at
    ]
  end
end
