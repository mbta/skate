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

  @doc """
  Formats a `Util.Location` into a `{longitude, latitude}` tuple

  ## Examples
      iex> Util.Location.into_long_lat_pair(
      ...>   Util.Location.new(42, -71)
      ...> )
      {-71, 42}
  """
  @spec into_long_lat_pair(location :: __MODULE__.t()) :: {float(), float()}
  def into_long_lat_pair(%__MODULE__{latitude: lat, longitude: long}), do: {long, lat}

  @doc """
  Finds the distance between the line formed by the points in the list parameter

  ### Example
      iex> Util.Location.distance([
      ...>    Util.Location.new(42, -71),
      ...>    Util.Location.new(42, -71),
      ...>    Util.Location.new(42, -71)
      ...> ])
      0.0

      iex> Util.Location.distance([
      ...>    Util.Location.new(42, -71.0001),
      ...>    Util.Location.new(42, -71.0002),
      ...>    Util.Location.new(42.0001, -71)
      ...> ])
      28.18270374034632
  """
  @spec distance(line :: [__MODULE__.t()]) :: float()
  @spec distance(a :: __MODULE__.t(), b :: __MODULE__.t()) :: float()
  def distance(line) when is_list(line) do
    Haversine.distance(Enum.map(line, &into_long_lat_pair/1))
  end

  @doc """
  Finds the distance between two points.

  ## Examples
      iex> Util.Location.distance(
      ...>    Util.Location.new(42, -71.0001),
      ...>    Util.Location.new(42, -71.0002)
      ...> )
      8.263404849683214

      iex> Util.Location.distance(
      ...>    Util.Location.new(42, -71.0002),
      ...>    Util.Location.new(42.0001, -71)
      ...> )
      19.919298890663107
  """
  def distance(%__MODULE__{} = lhs, %__MODULE__{} = rhs) do
    distance([lhs, rhs])
  end

defprotocol Util.Location.From do
  @doc """
  Converts `self` into a `Util.Location`.
  """
  @spec as_location(self :: __MODULE__.t()) :: {:ok, Util.Location.t()} | {:error, any()}
  def as_location(self)
end
end
