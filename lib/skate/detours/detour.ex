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
            intersection: String.t() | nil,
            updated_at: integer(),
            author_id: integer(),
            status: :active | :draft | :past,
            activated_at: DateTime.t() | nil,
            estimated_duration: String.t() | nil,
            reason: String.t() | nil,
            is_text_only: boolean()
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
      :reason,
      :is_text_only
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
           status: status,
           is_text_only: is_text_only
         }) do
      %__MODULE__{
        id: id,
        route: route_name,
        direction: direction,
        name: headsign,
        intersection: nearest_intersection,
        updated_at: timestamp_to_unix(updated_at),
        author_id: author_id,
        estimated_duration: estimated_duration,
        activated_at: activated_at,
        reason: reason,
        status: status,
        is_text_only: is_text_only
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
             updated_at: updated_at,
             is_text_only: is_text_only
           } = db_detour
         ) do
      direction = Map.get(direction_names, Integer.to_string(direction_id))
      Logger.warning("detour_missing_info using_context id=#{db_detour.id}")

      %__MODULE__{
        id: id,
        route: route_name,
        direction: direction,
        name: headsign,
        intersection: nearest_intersection,
        updated_at: timestamp_to_unix(updated_at),
        author_id: db_detour.author_id,
        status: status,
        reason: db_detour.reason,
        is_text_only: is_text_only
      }
    end

    defp extract_from_attributes(db_detour) do
      Logger.error(
        "detour_missing_info id=#{db_detour.id} status=#{inspect(db_detour.status)} headsign=#{inspect(db_detour.headsign)} route_name=#{db_detour.route_name} direction=#{db_detour.direction}"
      )

      nil
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

  defmodule Report do
    @moduledoc """
    Report-shaped detour for export to external services.
    """

    require Logger

    alias Skate.Detours.Db.Detour

    @type t :: %__MODULE__{
            id: integer(),
            route_id: String.t(),
            reason: String.t(),
            nearest_intersection: String.t() | nil,
            estimated_duration: String.t(),
            activated_at: integer(),
            updated_at: integer(),
            direction_id: integer(),
            missed_stops: [String.t()] | nil,
            connection_points: [String.t()] | nil,
            missed_stops_text_only: String.t() | nil,
            connection_points_text_only: String.t() | nil,
            route_segments:
              %{
                before_detour: [map()],
                after_detour: [map()],
                bypassed_segment: [map()],
                detour_segment: [map()]
              }
              | nil
          }

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
      :missed_stops_text_only,
      :connection_points_text_only,
      :route_segments
    ]

    @spec from!(Detour.t()) :: t()
    def from!(%Detour{is_text_only: true} = detour) do
      %{
        base_report(detour)
        | missed_stops_text_only: get_in(detour, ["typedDetour", "missedStops"]),
          connection_points_text_only: get_in(detour, ["typedDetour", "connectionPoints"])
      }
    end

    def from!(%Detour{is_text_only: false} = detour) do
      %{
        base_report(detour)
        | missed_stops: detour.missed_stops,
          connection_points: detour.connection_points,
          route_segments: detour.route_segments
      }
    end

    defp base_report(%Detour{} = detour) do
      %__MODULE__{
        id: detour.id,
        route_id: detour.route_id,
        direction_id: detour.direction_id,
        reason: detour.reason,
        nearest_intersection: detour.nearest_intersection,
        estimated_duration: detour.estimated_duration,
        activated_at: DateTime.to_unix(detour.activated_at),
        updated_at: naive_to_unix!(detour.updated_at)
      }
    end

    defp naive_to_unix!(naive_dt) do
      naive_dt
      |> DateTime.from_naive!("Etc/UTC")
      |> DateTime.to_unix()
    end

    defp route_segments(%Detour{
           routeSegments: %{
             "beforeDetour" => before_detour,
             "afterDetour" => after_detour,
             "detour" => detour_segment
           },
           detourShape: {"ok", %{"coordinates" => bypassed_segment}}
         }) do
      %{
        before_detour: before_detour,
        after_detour: after_detour,
        bypassed_segment: bypassed_segment,
        detour_segment: detour_segment
      }
    end
  end
end
