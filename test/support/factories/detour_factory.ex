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
        %Skate.Detours.Db.Detour{
          author: build(:user),
          state: build(:detour_snapshot),
          status: :draft
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
              "directionNames" => %{
                "0" => "Outbound",
                "1" => "Inbound"
              }
            },
            "routePattern" => %{
              "name" => sequence("detour_route_pattern_name:"),
              "headsign" => sequence("detour_route_pattern_headsign:"),
              "directionId" => direction_id,
              "id" =>
                sequence("detour_route_pattern_id:") <> "-_-" <> Integer.to_string(direction_id)
            },
            "nearestIntersection" => sequence("detour_nearest_intersection:")
          },
          "value" => %{},
          "children" => %{},
          "historyValue" => %{},
          "status" => "active"
        }
      end

      def with_id(%Skate.Detours.Db.Detour{} = detour, id) do
        %{
          detour
          | id: id,
            state: with_id(detour.state, id)
        }
      end

      def with_id(%{"context" => %{"uuid" => _}} = snapshot, id) do
        put_in(snapshot["context"]["uuid"], id)
      end

      def update_id(%Skate.Detours.Db.Detour{id: id} = detour) do
        with_id(detour, id)
      end

      def activated(
            update_arg,
            activated_at \\ DateTime.utc_now(),
            estimated_duration \\ "1 hour"
          )

      def activated(%Skate.Detours.Db.Detour{} = detour, activated_at, estimated_duration) do
        activated_at = Skate.DetourFactory.browser_date(activated_at)

        %{
          detour
          | state: activated(detour.state, activated_at, estimated_duration),
            activated_at: activated_at,
            status: :active,
            estimated_duration: estimated_duration
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

        put_in(
          state["context"]["selectedDuration"],
          estimated_duration
        )
      end

      def deactivated(%Skate.Detours.Db.Detour{} = detour) do
        %{detour | state: deactivated(detour.state), status: :past}
      end

      def deactivated(%{"value" => %{}} = state) do
        put_in(state["value"], %{"Detour Drawing" => "Past"})
      end

      def with_updated_at(detour, updated_at) do
        %{detour | updated_at: updated_at}
      end

      def with_route(%Skate.Detours.Db.Detour{} = detour, %{name: _, id: _} = route) do
        %{detour | state: with_route(detour.state, route)}
      end

      def with_route(
            %{"context" => %{"route" => %{}}} = state,
            %{name: route_name, id: route_id}
          ) do
        state
        |> with_route_id(route_id)
        |> with_route_name(route_name)
      end

      def with_route_name(%Skate.Detours.Db.Detour{} = detour, name) do
        %{detour | state: with_route_name(detour.state, name)}
      end

      def with_route_name(
            %{"context" => %{"route" => %{"name" => _}}} = state,
            name
          ) do
        put_in(state["context"]["route"]["name"], name)
      end

      def with_route_id(%Skate.Detours.Db.Detour{} = detour, id) do
        %{detour | state: with_route_id(detour.state, id)}
      end

      def with_route_id(
            %{"context" => %{"route" => %{"id" => _}}} = state,
            id
          ) do
        put_in(state["context"]["route"]["id"], id)
      end

      def with_direction(%Skate.Detours.Db.Detour{} = detour, direction) do
        %{
          detour
          | state: with_direction(detour.state, direction)
        }
      end

      def with_direction(
            %{"context" => %{"routePattern" => %{"directionId" => _}}} = state,
            :inbound
          ) do
        put_in(state["context"]["routePattern"]["directionId"], 1)
      end

      def with_direction(
            %{"context" => %{"routePattern" => %{"directionId" => _}}} = state,
            :outbound
          ) do
        put_in(state["context"]["routePattern"]["directionId"], 0)
      end

      def with_route_pattern_id(%Skate.Detours.Db.Detour{} = detour, id) do
        %{detour | state: with_route_pattern_id(detour.state, id)}
      end

      def with_route_pattern_id(
            %{"context" => %{"routePattern" => %{"id" => _}}} = state,
            id
          ) do
        put_in(state["context"]["routePattern"]["id"], id)
      end

      def with_headsign(%Skate.Detours.Db.Detour{} = detour, headsign) do
        %{detour | state: with_headsign(detour.state, headsign)}
      end

      def with_headsign(
            %{"context" => %{"routePattern" => %{"headsign" => _}}} = state,
            id
          ) do
        put_in(state["context"]["routePattern"]["headsign"], id)
      end

      def with_nearest_intersection(%Skate.Detours.Db.Detour{} = detour, headsign) do
        %{detour | state: with_nearest_intersection(detour.state, headsign)}
      end

      def with_nearest_intersection(
            %{"context" => %{"nearestIntersection" => _}} = state,
            headsign
          ) do
        put_in(state["context"]["nearestIntersection"], headsign)
      end

      def with_coordinates(
            detour,
            coordinates \\ [
              %{
                lat: 42.337949,
                lon: -71.074936
              },
              %{
                lat: 42.338488,
                lon: -71.066487
              },
              %{
                lat: 42.339672,
                lon: -71.067018
              },
              %{
                lat: 42.339848,
                lon: -71.067554
              },
              %{
                lat: 42.340134,
                lon: -71.068427
              },
              %{
                lat: 42.340216,
                lon: -71.068579
              }
            ]
          )

      def with_coordinates(
            %Skate.Detours.Db.Detour{} = detour,
            coordinates
          ) do
        %{detour | state: with_coordinates(detour.state, coordinates)}
      end

      def with_coordinates(state, coordinates) do
        put_in(state["context"]["detourShape"], %{"ok" => %{"coordinates" => coordinates}})
      end

      def with_missed_stops(%Skate.Detours.Db.Detour{} = detour, stops) do
        %{detour | state: with_missed_stops(detour.state, stops)}
      end

      def with_missed_stops(state, stops) do
        missed_stops = Enum.map(stops, fn stop_id -> %{"id" => stop_id} end)
        put_in(state["context"]["finishedDetour"], %{"missedStops" => missed_stops})
      end

      def with_author(%Skate.Detours.Db.Detour{} = detour, user) do
        %{detour | author: user}
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
