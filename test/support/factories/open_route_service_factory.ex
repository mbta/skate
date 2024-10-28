defmodule Skate.OpenRouteServiceFactory do
  @moduledoc """
  Defines ExMachina factory functions for `Skate.Factory` related to
  open route service API return values
  """

  defmacro __using__(_opts) do
    quote do
      def ors_directions_step_json_factory do
        %{
          "instruction" => sequence("ors_instruction_step"),
          "name" => sequence("ors_instruction_name"),
          "type" => sequence("ors_instruction_type", [0, 1, 2, 3, 4, 5, 6, 7, 12, 13])
        }
      end

      def ors_directions_segment_json_factory do
        %{
          "steps" =>
            build_list(
              sequence("ors_segment_json_num_steps", [4, 1, 3, 2]),
              :ors_directions_step_json
            )
        }
      end

      def ors_directions_json_factory(attrs) do
        coordinates = Map.get(attrs, :coordinates, [[0, 0], [1, 1], [2, 2]])

        segments =
          Map.get_lazy(attrs, :segments, fn ->
            build_list(3, :ors_directions_segment_json)
          end)

        %{
          "features" => [
            %{
              "geometry" => %{"coordinates" => coordinates},
              "properties" => %{
                "segments" => segments
              }
            }
          ]
        }
      end
    end
  end
end
