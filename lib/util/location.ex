defmodule Util.Location do
  @moduledoc """
  Provides functions for dealing with geographic coordinates.
  """

  alias Util.Vector2d

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
      iex> Util.Location.into_long_lat_pair(Util.Location.new(42, -71))
      {-71, 42}
  """
  @spec into_long_lat_pair(location :: __MODULE__.t()) :: {float(), float()}
  def into_long_lat_pair(%__MODULE__{latitude: lat, longitude: long}), do: {long, lat}

  @doc """
  Finds the distance between the line formed by the points in the list parameter

  ### Example
      iex> Util.Location.distance([
      ...>   Util.Location.new(42, -71),
      ...>   Util.Location.new(42, -71),
      ...>   Util.Location.new(42, -71)
      ...> ])
      0.0

      iex> Util.Location.distance([
      ...>   Util.Location.new(42, -71.0001),
      ...>   Util.Location.new(42, -71.0002),
      ...>   Util.Location.new(42.0001, -71)
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
      ...>   Util.Location.new(42, -71.0001),
      ...>   Util.Location.new(42, -71.0002)
      ...> )
      8.263404849683214

      iex> Util.Location.distance(
      ...>   Util.Location.new(42, -71.0002),
      ...>   Util.Location.new(42.0001, -71)
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

  @spec lat_long_scale_factors(loc :: __MODULE__.t()) :: %{
          latitude: number(),
          longitude: number()
        }
  defp lat_long_scale_factors(%__MODULE__{latitude: latitude, longitude: longitude}) do
    small_increment = 0.001

    %{
      latitude:
        distance(
          new(latitude, longitude),
          new(latitude + small_increment, longitude)
        ) / small_increment,
      longitude:
        distance(
          new(latitude, longitude),
          new(latitude, longitude + small_increment)
        ) / small_increment
    }
  end

  @doc """
  Returns the displacement between `to` and `from` as a `Util.Vector2d` given in meters.

  The `x` direction is east, and the `y` direction is north.

  ## Examples
      iex> Util.Location.displacement_from(
      ...>   Util.Location.new(42, -71.0001),
      ...>   Util.Location.new(42, -71.0002)
      ...> )
      %Util.Vector2d{x: 8.263404849676181, y: 0.0}

      iex> Util.Location.displacement_from(
      ...>   Util.Location.new(42.0001, -71.0002),
      ...>   Util.Location.new(42, -71.0002)
      ...> )
      %Util.Vector2d{x: 0.0, y: 11.119508023696506}

  If the displacement is south and/or west, then the `x` or `y` coordinate will be negative

  ## Example
      iex> Util.Location.displacement_from(
      ...>   Util.Location.new(42.0001, -71.0002),
      ...>   Util.Location.new(42.0002, -71.0001)
      ...> )
      %Util.Vector2d{x: -8.26337887771932, y: -11.119508022906418}
  """
  @spec displacement_from(to :: __MODULE__.From.t(), from :: __MODULE__.From.t()) :: Vector2d.t()
  def displacement_from(
        %__MODULE__{latitude: to_latitude, longitude: to_longitude},
        %__MODULE__{latitude: from_latitude, longitude: from_longitude} = from
      ) do
    %{latitude: latitude_scale_factor, longitude: longitude_scale_factor} =
      lat_long_scale_factors(from)

    longitude_diff = to_longitude - from_longitude
    latitude_diff = to_latitude - from_latitude

    %Vector2d{
      x: longitude_diff * longitude_scale_factor,
      y: latitude_diff * latitude_scale_factor
    }
  end

  @doc """
  Returns the coordinates you get by displacing the first argument (a lat/long coordinate pair)
  `x` meters east and `y` meters north.

  ## Examples
      iex> Util.Location.displace_by(
      ...>   Util.Location.new(42.0, -71.0),
      ...>   %Util.Vector2d{x: 10.0, y: 0.0}
      ...> )
      %Util.Location{latitude: 42.0, longitude: -70.99987898450841}

      iex> Util.Location.displace_by(
      ...>   Util.Location.new(42.0, -71.0),
      ...>   %Util.Vector2d{x: 0.0, y: 10.0}
      ...> )
      %Util.Location{latitude: 42.000089932036374, longitude: -71.0}

  Negative values of `x` and `y` correspond to west and south displacements.

  ## Example
      iex> Util.Location.displace_by(
      ...>   Util.Location.new(42.0, -71.0),
      ...>   %Util.Vector2d{x: -10.0, y: -10.0}
      ...> )
      %Util.Location{latitude: 41.999910067963626, longitude: -71.00012101549159}
  """
  @spec displace_by(loc :: __MODULE__.t(), displacement :: Util.Vector2d.t()) :: __MODULE__.t()
  def displace_by(
        %__MODULE__{latitude: from_latitude, longitude: from_longitude} = from,
        %Vector2d{x: x, y: y}
      ) do
    %{latitude: latitude_scale_factor, longitude: longitude_scale_factor} =
      lat_long_scale_factors(from)

    longitude_diff = x / longitude_scale_factor
    latitude_diff = y / latitude_scale_factor

    new(from_latitude + latitude_diff, from_longitude + longitude_diff)
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
