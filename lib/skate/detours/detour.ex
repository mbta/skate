defmodule Skate.Detours.Detour do
  @moduledoc """
  Modules for different detour structures that can be read from the db
  """

  alias Schedule.Gtfs.RoutePattern

  defmodule Detailed do
    @moduledoc """
    Detailed detours have had the db detour state parsed into attributes
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
            status: :active | :draft | :past
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
      :status
    ]

    def from(
          status,
          %{
            state: %{
              "context" => %{
                "route" => %{"name" => route_name, "directionNames" => direction_names},
                "routePattern" => %{
                  "headsign" => headsign,
                  "directionId" => direction_id,
                  "id" => route_pattern_id
                },
                "nearestIntersection" => nearest_intersection
              }
            }
          } = db_detour
        ) do
      direction = Map.get(direction_names, Integer.to_string(direction_id))

      %__MODULE__{
        id: db_detour.id,
        route: route_name,
        via_variant: RoutePattern.via_variant(route_pattern_id),
        direction: direction,
        name: headsign,
        intersection: nearest_intersection,
        updated_at: timestamp_to_unix(db_detour.updated_at),
        author_id: db_detour.author_id,
        status: status
      }
    end

    def from(_status, _attrs), do: nil

    # Converts the db timestamp to unix
    defp timestamp_to_unix(db_date) do
      db_date
      |> DateTime.from_naive!("Etc/UTC")
      |> DateTime.to_unix()
    end
  end

  defmodule ActivatedDetourDetails do
    @moduledoc """
    Extended information for active detours
    """

    @type t :: %__MODULE__{
            activated_at: DateTime.t(),
            estimated_duration: String.t(),
            details: Detailed.t()
          }

    @derive Jason.Encoder

    defstruct [
      :activated_at,
      :estimated_duration,
      :details
    ]
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
