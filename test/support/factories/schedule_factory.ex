defmodule Skate.ScheduleFactory do
  @moduledoc """
  Defines ExMachina factory functions for `Skate.Factory` related to `Schedule`
  """

  defmacro __using__(_opts) do
    quote do
      def piece_factory do
        %Schedule.Piece{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 50,
          start_place: "garage",
          trips: [
            build(:trip),
            build(:trip, %{id: "trip2", route_id: "route"})
          ],
          end_time: 200,
          end_place: "station"
        }
      end

      def block_factory do
        %Schedule.Block{
          id: "block",
          service_id: "service",
          schedule_id: "schedule",
          start_time: 0,
          end_time: 1,
          pieces: [build(:piece)]
        }
      end

      def run_factory do
        %Schedule.Run{
          schedule_id: "schedule",
          service_id: "service",
          id: "run",
          activities: [
            build(:piece)
          ]
        }
      end

      def as_directed_factory do
        %Schedule.AsDirected{
          kind: :wad,
          start_time: 1,
          end_time: 2,
          start_place: "place1",
          end_place: "place2"
        }
      end

      def shape_with_stops_factory(attrs) do
        shape = build(:gtfs_shape, Map.take(attrs, [:id, :points]))

        shape_with_stops = %Schedule.ShapeWithStops{
          id: shape.id,
          points: shape.points,
          stops: build_list(3, :gtfs_stop)
        }

        merge_attributes(shape_with_stops, attrs)
      end

      def trip_factory do
        %Schedule.Trip{
          id: "trip",
          block_id: "block",
          route_id: "route",
          service_id: "service",
          headsign: "headsign",
          direction_id: 0,
          run_id: "run",
          stop_times: [
            build(:gtfs_stoptime)
          ],
          start_time: 100,
          end_time: 200
        }
      end
    end
  end
end
