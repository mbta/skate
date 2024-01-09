defmodule Skate.OpenRouteServiceAPI.DirectionsResponse do
  @moduledoc """
  A structured response from the OpenRouteService Directions API
  """
  @derive Jason.Encoder

  @typedoc """
    Type that represents a request made to OpenRouteService's Directions API
  """
  @type t() :: %__MODULE__{
          coordinates: [[float()]]
        }

  defstruct coordinates: []
end
