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

      def activated(%Skate.Detours.Db.Detour{} = detour) do
        %{detour | state: activated(detour.state)}
      end

      def activated(%{"value" => %{}} = state) do
        put_in(state["value"], %{"Detour Drawing" => %{"Active" => "Reviewing"}})
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
end
