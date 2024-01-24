defmodule Skate.OpenRouteServiceAPI.DirectionsResponse do
  @moduledoc """
  A structured response from the OpenRouteService Directions API
  """
  @derive Jason.Encoder

  @typedoc """
    Type that represents a request made to OpenRouteService's Directions API
  """
  @type t() :: %__MODULE__{
          coordinates: [[float()]],
          directions: [
            %{
              instruction: binary(),
              name: binary(),
              type: direction_t()
            }
          ]
        }

  @type direction_t() ::
          :left
          | :right
          | :sharp_left
          | :sharp_right
          | :slight_left
          | :slight_right
          | :straight
          | :enter_roundabout
          | :exit_roundabout
          | :u_turn
          | :goal
          | :depart
          | :keep_left
          | :keep_right

  defstruct coordinates: [], directions: []
end
