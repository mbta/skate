defmodule Skate.Detours.Detour do
  @moduledoc """
  Modules for different detour structures that can be read from the db
  """

  require Logger

  defmodule Simple do
    @moduledoc """
    Simple detours have had the db detour state parsed into attributes
    """
    @type t :: %__MODULE__{
            id: integer(),
            route: String.t(),
            direction: String.t(),
            name: String.t(),
            intersection: String.t(),
            updated_at: integer(),
            author_id: integer(),
            status: :active | :draft | :past,
            activated_at: DateTime.t() | nil,
            estimated_duration: String.t() | nil,
            reason: String.t() | nil
          }

    @derive Jason.Encoder

    defstruct [
      :id,
      :route,
      :direction,
      :name,
      :intersection,
      :updated_at,
      :author_id,
      :status,
      :activated_at,
      :estimated_duration,
      :reason
    ]

    def from(
          :active,
          %{
            status: :active,
            activated_at: activated_at,
            estimated_duration: estimated_duration
          } = db_detour
        ) do
      state = Map.get(db_detour, :state, %{})

      if activated_at == nil || estimated_duration == nil do
        selected_duration = get_in(state, ["context", "selectedDuration"])

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
          attrs
        ) do
      extract_from_attributes(attrs)
    end

    defp extract_from_attributes(%{
           id: id,
           author_id: author_id,
           updated_at: updated_at,
           route_name: route_name,
           headsign: headsign,
           nearest_intersection: nearest_intersection,
           direction: direction,
           estimated_duration: estimated_duration,
           activated_at: activated_at,
           reason: reason,
           status: status
         })
         when not is_nil(headsign) and not is_nil(direction) and not is_nil(route_name) and
                not is_nil(nearest_intersection) do
      %__MODULE__{
        id: id,
        route: route_name,
        direction: direction,
        name: headsign,
        intersection: nearest_intersection,
        updated_at: Util.Time.timestamp_to_unix(updated_at),
        author_id: author_id,
        estimated_duration: estimated_duration,
        activated_at: activated_at,
        reason: reason,
        status: status
      }
    end

    # Backup retrieve from state in case the information was not fetched correctly from the database fields
    defp extract_from_attributes(
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
        direction: direction,
        name: headsign,
        intersection: nearest_intersection,
        updated_at: Util.Time.timestamp_to_unix(updated_at),
        author_id: db_detour.author_id,
        status: status,
        reason: db_detour.reason
      }
    end

    defp extract_from_attributes(db_detour) do
      Logger.error(
        "detour_missing_info id=#{db_detour.id} status=#{inspect(db_detour.status)} headsign=#{inspect(db_detour.headsign)} route_name=#{db_detour.route_name} direction=#{db_detour.direction}"
      )

      nil
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

  defmodule ReportDetour do
    @moduledoc """
    Report active detours contain the information required by LAMP and others
    """

    @type t :: %__MODULE__{
            id: integer(),
            route_id: String.t(),
            reason: String.t(),
            nearest_intersection: String.t(),
            estimated_duration: String.t(),
            activated_at: integer(),
            updated_at: integer(),
            direction_id: Integer.t(),
            missed_stops: [String.t()],
            connection_points: [String.t()],
            route_segments: %{
              before_detour: [Util.Location.From.t()],
              after_detour: [Util.Location.From.t()],
              bypassed_segment: [Util.Location.From.t()],
              after_detour: [Util.Location.From.t()]
            }
          }
    # detour commence stop?
    # detour end stop?

    @derive Jason.Encoder

    defstruct [
      :id,
      :route_id,
      :reason,
      :nearest_intersection,
      :estimated_duration,
      :activated_at,
      :updated_at,
      :direction_id,
      :missed_stops,
      :connection_points,
      :route_segments
    ]

    def from(%{
          id: id,
          route_id: route_id,
          reason: reason,
          nearest_intersection: nearest_intersection,
          estimated_duration: estimated_duration,
          activated_at: activated_at,
          updated_at: updated_at,
          state: %{
            "context" => %{
              "routePattern" => %{
                "directionId" => direction_id
              },
              "finishedDetour" => %{
                "missedStops" => missed_stops,
                "connectionPoint" => %{
                  "start" => %{
                    "id" => connection_start_stop_id
                  },
                  "end" => %{
                    "id" => connection_end_stop_id
                  }
                },
                "routeSegments" => %{
                  "beforeDetour" => before_detour,
                  "afterDetour" => after_detour,
                  "detour" => bypassed_segment
                },
                "detourShape" => %{"coordinates" => detour_segment}
              }
            }
          }
        }) do
      %__MODULE__{
        id: id,
        route_id: route_id,
        reason: reason,
        nearest_intersection: nearest_intersection,
        estimated_duration: estimated_duration,
        activated_at: DateTime.to_unix(activated_at),
        updated_at: Util.Time.timestamp_to_unix(updated_at),
        direction_id: direction_id,
        missed_stops: Enum.map(missed_stops, & &1["id"]),
        connection_points: [connection_start_stop_id, connection_end_stop_id],
        route_segments: %{
          before_detour: before_detour,
          detour_segment: detour_segment,
          bypassed_segment: bypassed_segment,
          after_detour: after_detour
        }
      }
    end

    def from(_db_detour) do
      IO.puts("ack")
    end
  end
end
