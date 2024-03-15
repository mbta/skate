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
  Returns the distance between the point and the segment defined by
  segment_start and segment_end, as well as the point on the segment
  that provides that minimum distance.

  ## Examples
      iex> Util.Location.distance_from_segment(
      ...>   Util.Location.new(42.00004, -71.00014),
      ...>   {Util.Location.new(42, -71.0002), Util.Location.new(42.0001, -71.0001)}
      ...> )
      %{
        closest_point: %Util.Location{latitude: 42.00004711559566, longitude: -71.00015288440434},
        distance: 1.3264961988869075
      }
  """
  @spec distance_from_segment(
          point :: __MODULE__.From.t(),
          {segment_start :: __MODULE__.From.t(), segment_end :: __MODULE__.From.t()}
        ) :: %{closest_point: __MODULE__.t(), distance: number()}

  def distance_from_segment(
        %__MODULE__{latitude: latitude, longitude: longitude} = point,
        {%{latitude: start_latitude, longitude: start_longitude},
         %{latitude: end_latitude, longitude: end_longitude}}
      ) do
    # Scale factors used to transform between lat/long and a coordinate
    # system based on distance
    latitude_scale_factor =
      1000 *
        distance(
          new(start_latitude, start_longitude),
          new(start_latitude + 0.001, start_longitude)
        )

    longitude_scale_factor =
      1000 *
        distance(
          new(start_latitude, start_longitude),
          new(start_latitude, start_longitude + 0.001)
        )

    # Use the above scale factors to transform both the original
    # segment and the point in question to (x, y) coordinates, where
    # the origin is the segment start point, x is meters east from
    # there, and y is meters north
    segment_end_x = longitude_scale_factor * (end_longitude - start_longitude)
    segment_end_y = latitude_scale_factor * (end_latitude - start_latitude)

    x = longitude_scale_factor * (longitude - start_longitude)
    y = latitude_scale_factor * (latitude - start_latitude)

    squared_segment_length = segment_end_x ** 2 + segment_end_y ** 2

    {closest_x, closest_y} =
      cond do
        squared_segment_length == 0 ->
          # If squared_segment_length is 0, then that means the whole
          # segment is actually just a point, located at the origin in
          # (x, y) space, which means that the nearest point on the
          # segment must also be that single point. Since otherwise we
          # divide by squared_segment_length, we need to short-circuit
          # here in order to avoid a divide-by-zero.
          {0, 0}

        squared_segment_length > 0 ->
          # Transform the coordinates of the non-segment point to (u, v),
          # where segment_start is at (0, 0) and segment_end is at (1, 0).
          # We don't bother computing the v coordinate because we don't need
          # it.
          u = (x * segment_end_x + y * segment_end_y) / squared_segment_length

          # In (u, v)-space, if the point's u coordinate is between 0 and 1,
          # then the nearest point on the segment (0, 0) -- (1, 0) is the
          # point (u, 0). Otherwise, it's whichever is closer of (0, 0) or
          # (1, 0).
          closest_u =
            cond do
              u < 0 -> 0
              u > 1 -> 1
              true -> u
            end

          # Transform the nearest point back to (x, y) space
          {closest_u * segment_end_x, closest_u * segment_end_y}
      end

    # Transform the nearest point back to (lat, long) space
    closest_longitude = start_longitude + closest_x / longitude_scale_factor
    closest_latitude = start_latitude + closest_y / latitude_scale_factor

    closest_point = new(closest_latitude, closest_longitude)

    %{closest_point: closest_point, distance: distance(closest_point, point)}
  end

  def distance_from_segment(point, {segment_start, segment_end}) do
    distance_from_segment(
      as_location!(point),
      {as_location!(segment_start), as_location!(segment_end)}
    )
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
