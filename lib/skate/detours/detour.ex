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
            estimated_duration: String.t() | nil
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
          attrs
        ) do
      extract_from_attributes(attrs)
    end

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
        updated_at: timestamp_to_unix(updated_at),
        author_id: db_detour.author_id,
        status: status
      }
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
        updated_at: timestamp_to_unix(updated_at),
        author_id: author_id,
        estimated_duration: estimated_duration,
        activated_at: activated_at,
        status: status
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
end
