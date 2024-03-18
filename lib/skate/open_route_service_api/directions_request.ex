defmodule Skate.OpenRouteServiceAPI.DirectionsRequest do
  @moduledoc """
  A request to the OpenRouteService Directions API
  """
  @derive Jason.Encoder

  defmodule Options do
    @moduledoc false
    defmodule ProfileParams do
      @moduledoc false
      defmodule HgvRestrictions do
        @moduledoc false
        @type t :: %{length: float(), width: float(), height: float()}
        defstruct [:length, :width, :height]

        def bus_40ft,
          do: %{
            length: 12.192,
            width: 3.2004,
            height: 3.5052
          }
      end

      @type t :: %{restrictions: HgvRestrictions.t()}
      defstruct [:restrictions]
    end

    @type t :: %{profile_params: ProfileParams.t()}
    defstruct [:profile_params]
  end

  @typedoc """
    Type that represents a request made to OpenRouteService's Directions API
  """
  @type t() :: %__MODULE__{
          coordinates: [[float()]],
          continue_straight: boolean(),
          options: Options.t()
        }

  defstruct coordinates: [],
            continue_straight: true,
            options: %{
              profile_params: %{
                restrictions:
                  Skate.OpenRouteServiceAPI.DirectionsRequest.Options.ProfileParams.HgvRestrictions.bus_40ft()
              }
            }
end
