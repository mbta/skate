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
  Constructs a `Util.Location` struct from a `longitude` `latitude` tuple.

  ## Examples
        iex> Util.Location.from_long_lat_pair({-2, 2})
        %Util.Location{
          latitude: 2,
          longitude: -2
        }
  """
  @spec from_long_lat_pair({longitude :: float(), latitude :: float()}) :: __MODULE__.t()
  def from_long_lat_pair({long, lat}), do: Util.Location.new(lat, long)

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
  @spec distance(a :: __MODULE__.From.t(), b :: __MODULE__.From.t()) :: float()
  def distance(%__MODULE__{} = lhs, %__MODULE__{} = rhs) do
    distance([lhs, rhs])
  end

  def distance(lhs, rhs) do
    distance(as_location!(lhs), as_location!(rhs))
  end

  @doc """
  Coerces an object into a `%Util.Location{}` struct.

  Requires that `self` implements the `Util.Location.From` protocol.
  Will error if the conversion fails.
  """
  @spec as_location!(self :: Util.Location.From.t()) :: t()
  def as_location!(self) do
    {:ok, location} = Util.Location.From.as_location(self)
    location
  end
end

defprotocol Util.Location.From do
  @doc """
  Converts `self` into a `Util.Location`.
  """
  @spec as_location(self :: __MODULE__.t()) :: {:ok, Util.Location.t()} | {:error, any()}
  def as_location(self)
end

defimpl Util.Location.From, for: Util.Location do
  def as_location(%Util.Location{} = location), do: {:ok, location}
end
