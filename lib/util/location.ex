defmodule Util.Location do
  @moduledoc """
  Provides functions for dealing with geographic coordinates.
  """

  @type t :: %__MODULE__{
          latitude: float(),
          longitude: float()
        }

  @enforce_keys [:latitude, :longitude]
  defstruct [:latitude, :longitude]

  @doc """
  Constructs a `Util.Location` struct from the `latitude` and `longitude` parameters

  ### Example
      iex> Util.Location.new(42, -71)
      %Util.Location{
        latitude: 42,
        longitude: -71
      }
  """
  @spec new(latitude :: float(), longitude :: float()) :: __MODULE__.t()
  def new(latitude, longitude), do: %Util.Location{latitude: latitude, longitude: longitude}
end
