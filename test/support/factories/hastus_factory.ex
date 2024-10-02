defmodule Skate.HastusFactory do
  @moduledoc """
  Defines ExMachina factory functions for `Skate.Factory` related to HASTUS data
  """

  defmacro __using__(_opts) do
    quote do
      def hastus_trip_factory do
        %Schedule.Hastus.Trip{
          schedule_id: "schedule",
          run_id: "run",
          block_id: "block",
          start_time: 100,
          end_time: 102,
          start_place: "place1",
          end_place: "place2",
          route_id: "route",
          trip_id: "trip1"
        }
      end

      def hastus_activity_factory do
        %Schedule.Hastus.Activity{
          schedule_id: "schedule",
          run_id: "run",
          start_time: 100,
          end_time: 105,
          start_place: "place1",
          end_place: "place2",
          activity_type: "Operator",
          partial_block_id: "block"
        }
      end
    end
  end
end
