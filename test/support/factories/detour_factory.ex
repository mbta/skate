defmodule Skate.DetourFactory do
  @moduledoc """
  Defines ExMachina factory functions for `Skate.Factory` related to
  `Skate.Detours`
  """

  # credo:disable-for-this-file Credo.Check.Refactor.LongQuoteBlocks
  defmacro __using__(_opts) do
    quote do
      def missed_stops_result_factory do
        %Skate.Detours.MissedStops.Result{
          missed_stops: build_list(3, :gtfs_stop),
          connection_stop_start: build(:gtfs_stop),
          connection_stop_end: build(:gtfs_stop)
        }
      end

      def detour_expiration_task_factory do
        %Skate.Detours.Db.DetourExpirationTask{
          detour: build(:detour),
          notification_offset_minutes: 0,
          expires_at: DateTime.utc_now(),
          status: :scheduled
        }
      end

      def expires(%Skate.Detours.Db.DetourExpirationTask{} = task, expires_at) do
        %{task | expires_at: expires_at}
      end

      def completed(%Skate.Detours.Db.DetourExpirationTask{} = task) do
        %{task | status: :completed}
      end

      def detour_factory do
        headsign = sequence("detour_route_pattern_headsign:")

        %Skate.Detours.Db.Detour{
          author: build(:user),
          status: :draft,
          state_value: %{"SaveState" => "Saved", "Detour Drawing" => "Share Detour"},
          snapshot_children: %{},
          route_id: sequence("detour_route_id:"),
          route_name: sequence("detour_route_name:"),
          garages: [],
          direction_names: %{"0" => "Outbound", "1" => "Inbound"},
          route_pattern: %{
            "id" => sequence("detour_route_pattern_id:") <> "-_--1",
            "name" => sequence("detour_route_pattern_name:"),
            "headsign" => headsign,
            "directionId" => 0
          },
          headsign: headsign,
          direction: "Outbound",
          direction_id: 0,
          nearest_intersection: sequence("detour_nearest_intersection:"),
          is_text_only: false,
          undo_stack: [],
          detour_shape: %{"ok" => %{"coordinates" => []}},
          coordinates: [],
          connection_points: %{"start" => %{"id" => "start"}, "end" => %{"id" => "end"}},
          route_segments: %{"beforeDetour" => [], "afterDetour" => [], "detour" => []},
          missed_stops: []
        }
      end

      def detour_snapshot_factory do
        direction_id = sequence(:detour_route_pattern_direction, [0, 1])

        %{
          "context" => %{
            "uuid" => nil,
            "route" => %{
              "id" => sequence("detour_route_id:"),
              "name" => sequence("detour_route_name:"),
              "garages" => [],
              "directionNames" => %{"0" => "Outbound", "1" => "Inbound"}
            },
            "routePattern" => %{
              "name" => sequence("detour_route_pattern_name:"),
              "headsign" => sequence("detour_route_pattern_headsign:"),
              "directionId" => direction_id,
              "id" =>
                sequence("detour_route_pattern_id:") <> "-_-" <> Integer.to_string(direction_id)
            },
            "nearestIntersection" => sequence("detour_nearest_intersection:"),
            "isTextOnly" => false,
            "undoStack" => []
          },
          "value" => %{},
          "children" => %{},
          "status" => "active"
        }
      end

      def with_id(%Skate.Detours.Db.Detour{} = detour, id) do
        %{detour | id: id}
      end

      def with_id(%{"context" => %{"uuid" => _}} = snapshot, id) do
        put_in(snapshot["context"]["uuid"], id)
      end

      def update_id(%Skate.Detours.Db.Detour{} = detour) do
        with_id(detour, detour.id)
      end

      def activated(
            detour_or_state,
            activated_at \\ DateTime.utc_now(),
            estimated_duration \\ "1 hour"
          )

      def activated(%Skate.Detours.Db.Detour{} = detour, activated_at, estimated_duration) do
        activated_at = Skate.DetourFactory.browser_date(activated_at)

        %{
          detour
          | activated_at: activated_at,
            updated_at: activated_at,
            status: :active,
            estimated_duration: estimated_duration,
            state_value: %{"SaveState" => "Saved", "Detour Drawing" => %{"Active" => "Reviewing"}}
        }
      end

      def activated(%{"value" => %{}, "context" => %{}} = state, activated_at, estimated_duration) do
        state =
          put_in(state["value"], %{"Detour Drawing" => %{"Active" => "Reviewing"}})

        state =
          put_in(
            state["context"]["activatedAt"],
            activated_at
            |> Skate.DetourFactory.browser_date()
            |> DateTime.to_iso8601()
          )

        put_in(state["context"]["selectedDuration"], estimated_duration)
      end

      def deactivated(%Skate.Detours.Db.Detour{} = detour) do
        %{
          detour
          | status: :past,
            state_value: %{"SaveState" => "Saved", "Detour Drawing" => "Past"}
        }
      end

      def deactivated(%{"value" => %{}} = state) do
        put_in(state["value"], %{"Detour Drawing" => "Past"})
      end

      def with_updated_at(detour, updated_at) do
        %{detour | updated_at: updated_at}
      end

      def with_autoclose_on(detour, autoclose_on) do
        %{detour | autoclose_on: autoclose_on}
      end

      @spec with_estimated_duration(Skate.Detours.Db.Detour.t() | map(), String.t()) :: map()
      def with_estimated_duration(detour_or_state, estimated_duration)

      def with_estimated_duration(%Skate.Detours.Db.Detour{} = detour, estimated_duration) do
        %{detour | estimated_duration: estimated_duration}
      end

      def with_estimated_duration(%{"context" => %{}} = state, estimated_duration) do
        put_in(state, ["context", "selectedDuration"], estimated_duration)
      end

      def with_route(%Skate.Detours.Db.Detour{} = detour, %{name: route_name, id: route_id}) do
        detour |> with_route_id(route_id) |> with_route_name(route_name)
      end

      def with_route(%{"context" => %{"route" => _}} = state, %{name: route_name, id: route_id}) do
        state |> with_route_id(route_id) |> with_route_name(route_name)
      end

      def with_route_name(%Skate.Detours.Db.Detour{} = detour, name) do
        %{detour | route_name: name}
      end

      def with_route_name(%{"context" => %{"route" => _}} = state, name) do
        put_in(state, ["context", "route", "name"], name)
      end

      def with_route_id(%Skate.Detours.Db.Detour{} = detour, id) do
        %{detour | route_id: id}
      end

      def with_route_id(%{"context" => %{"route" => _}} = state, id) do
        put_in(state, ["context", "route", "id"], id)
      end

      def with_direction(%Skate.Detours.Db.Detour{} = detour, direction) do
        {direction_str, direction_id} =
          case direction do
            :inbound -> {"Inbound", 1}
            :outbound -> {"Outbound", 0}
          end

        %{detour | direction: direction_str, direction_id: direction_id}
      end

      def with_direction(%{"context" => %{"routePattern" => _}} = state, direction) do
        direction_id =
          case direction do
            :inbound -> 1
            :outbound -> 0
          end

        put_in(state, ["context", "routePattern", "directionId"], direction_id)
      end

      def with_route_pattern_id(%Skate.Detours.Db.Detour{} = detour, id) do
        %{detour | route_pattern: Map.put(detour.route_pattern || %{}, "id", id)}
      end

      def with_route_pattern_id(%{"context" => %{"routePattern" => _}} = state, id) do
        put_in(state, ["context", "routePattern", "id"], id)
      end

      def with_headsign(%Skate.Detours.Db.Detour{} = detour, headsign) do
        %{
          detour
          | headsign: headsign,
            route_pattern: Map.put(detour.route_pattern || %{}, "headsign", headsign)
        }
      end

      def with_headsign(%{"context" => %{"routePattern" => _}} = state, headsign) do
        put_in(state, ["context", "routePattern", "headsign"], headsign)
      end

      def with_nearest_intersection(%Skate.Detours.Db.Detour{} = detour, value) do
        %{detour | nearest_intersection: value}
      end

      def with_nearest_intersection(%{"context" => %{"nearestIntersection" => _}} = state, value) do
        put_in(state, ["context", "nearestIntersection"], value)
      end

      def with_coordinates(
            update_arg,
            coordinates \\ [
              %{lat: 42.337949, lon: -71.074936},
              %{lat: 42.338488, lon: -71.066487},
              %{lat: 42.339672, lon: -71.067018},
              %{lat: 42.339848, lon: -71.067554},
              %{lat: 42.340134, lon: -71.068427},
              %{lat: 42.340216, lon: -71.068579}
            ]
          )

      def with_coordinates(%Skate.Detours.Db.Detour{} = detour, coordinates) do
        %{
          detour
          | coordinates: coordinates,
            detour_shape: %{"ok" => %{"coordinates" => coordinates}}
        }
      end

      def with_coordinates(%{"context" => %{}} = state, coordinates) do
        put_in(state, ["context", "detourShape"], %{"ok" => %{"coordinates" => coordinates}})
      end

      def with_missed_stops(%Skate.Detours.Db.Detour{} = detour, stops) do
        missed_stops = Enum.map(stops, fn stop_id -> %{"id" => stop_id} end)

        detour
        |> Map.put(:missed_stops, missed_stops)
      end

      def with_missed_stops(state, stops) do
        missed_stops = Enum.map(stops, fn stop_id -> %{"id" => stop_id} end)

        update_in(state, ["context", "finishedDetour"], fn
          nil -> %{"missedStops" => missed_stops}
          finished_detour -> Map.put(finished_detour, "missedStops", missed_stops)
        end)
      end

      def with_finished_state(detour_or_state, opts \\ [])

      def with_finished_state(%Skate.Detours.Db.Detour{} = detour, opts) do
        detour
        |> maybe_update_detour_field(:route_segments, Keyword.get(opts, :route_segments))
        |> maybe_update_detour_field(:connection_points, Keyword.get(opts, :connection_point))
        |> maybe_update_detour_field(:detour_shape, Keyword.get(opts, :detour_shape))
      end

      def with_finished_state(state, opts) do
        defaults = %{
          "connectionPoint" => %{"start" => %{"id" => "101"}, "end" => %{"id" => "102"}},
          "routeSegments" => %{"beforeDetour" => [], "afterDetour" => [], "detour" => []},
          "detourShape" => %{"coordinates" => []}
        }

        overrides =
          [
            {"connectionPoint", Keyword.get(opts, :connection_point)},
            {"routeSegments", Keyword.get(opts, :route_segments)},
            {"detourShape", Keyword.get(opts, :detour_shape)},
            {"missedStops", missed_stops_from_opts(opts)}
          ]
          |> Enum.filter(fn {_key, value} -> not is_nil(value) end)
          |> Map.new()

        finished_detour =
          (get_in(state, ["context", "finishedDetour"]) || %{})
          |> Map.merge(defaults)
          |> Map.merge(overrides)

        put_in(state, ["context", "finishedDetour"], finished_detour)
      end

      defp maybe_update_detour_field(detour, field, nil), do: detour
      defp maybe_update_detour_field(detour, field, value), do: Map.put(detour, field, value)

      defp missed_stops_from_opts(opts) do
        case Keyword.get(opts, :missed_stops) do
          nil -> nil
          stops when is_list(stops) -> Enum.map(stops, fn id -> %{"id" => to_string(id)} end)
        end
      end

      def with_author(%Skate.Detours.Db.Detour{} = detour, user) do
        Map.put(detour, :author, user)
      end
    end
  end

  @doc """
  Browsers cannot generate javascript `Date` objects with more precision than a
  `millisecond` for security reasons.
  https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/now#reduced_time_precision

  This function truncates a `DateTime` to milliseconds to create `DateTime` objects
  that are similar to that of one made in a Browser JS context.
  """
  def browser_date(%DateTime{} = date \\ DateTime.utc_now()) do
    DateTime.truncate(date, :millisecond)
  end

  @doc """
  While a Browser may generate a date truncated to milliseconds
  (see `browser_date` for more context) a `DateTime` stored into Postgres with
  the `:utc_datetime_usec` type does not store the extra information about the
  non-presence of nanoseconds that a `DateTime` object does.
  This means a `DateTime` object that's been truncated by `browser_date` cannot
  be compared to a `DateTime` object reconstructed by Ecto after a Database query.

  This function adds 0 nanoseconds to a `DateTime` object to make the `DateTime`
  object match what Ecto would return to make testing easier when comparing
  values.
  """
  def db_date(%DateTime{} = date) do
    DateTime.add(date, 0, :nanosecond)
  end
end
