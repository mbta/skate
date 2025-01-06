defmodule Skate.DetourFactory do
  @moduledoc """
  Defines ExMachina factory functions for `Skate.Factory` related to
  `Skate.Detours`
  """

  defmacro __using__(_opts) do
    quote do
      def missed_stops_result_factory do
        %Skate.Detours.MissedStops.Result{
          missed_stops: build_list(3, :gtfs_stop),
          connection_stop_start: build(:gtfs_stop),
          connection_stop_end: build(:gtfs_stop)
        }
      end

      def detour_factory do
        %Skate.Detours.Db.Detour{
          author: build(:user),
          state: build(:detour_snapshot)
        }
      end

      def detour_snapshot_factory do
        %{
          "context" => %{
            "uuid" => nil,
            "route" => %{
              "name" => sequence("detour_route_name:"),
              "directionNames" => %{
                "0" => "Outbound",
                "1" => "Inbound"
              }
            },
            "routePattern" => %{
              "name" => sequence("detour_route_pattern_name:"),
              "headsign" => sequence("detour_route_pattern_headsign:"),
              "directionId" => sequence(:detour_route_pattern_direction, [0, 1])
            }
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

      def activated(update_arg, activated_at \\ DateTime.utc_now())

      def activated(%Skate.Detours.Db.Detour{} = detour, activated_at) do
        activated_at = Skate.DetourFactory.browser_date(activated_at)
        %{detour | state: activated(detour.state, activated_at), activated_at: activated_at}
      end

      def activated(%{"value" => %{}, "context" => %{}} = state, activated_at) do
        state =
          put_in(state["value"], %{"Detour Drawing" => %{"Active" => "Reviewing"}})

        put_in(
          state["context"]["activatedAt"],
          activated_at
          |> Skate.DetourFactory.browser_date()
          |> DateTime.to_iso8601()
        )
      end

      def deactivated(%Skate.Detours.Db.Detour{} = detour) do
        %{detour | state: deactivated(detour.state)}
      end

      def deactivated(%{"value" => %{}} = state) do
        put_in(state["value"], %{"Detour Drawing" => "Past"})
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
