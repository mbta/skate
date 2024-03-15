defmodule Skate.OpenRouteServiceAPI.DirectionsRequest do
  @moduledoc """
  A request to the OpenRouteService Directions API
  """
  @derive Jason.Encoder

  @typedoc """
    Type that represents a request made to OpenRouteService's Directions API
  """
  @type t() :: %__MODULE__{
          coordinates: [[float()]],
          continue_straight: boolean(),
          options: map()
        }

  defstruct coordinates: [],
            continue_straight: true,
            options: %{
              profile_params: %{
                restrictions: %{
                  length: 12.192,
                  width: 3.2004,
                  height: 3.5052
                }
              }
            }
end
