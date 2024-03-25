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
      ...>    Util.Location.new(42, -71.0001),
      ...>    Util.Location.new(42, -71.0002)
      ...> )
      %Util.Vector2d{x: 8.263404849676181, y: 0.0}

      iex> Util.Location.displacement_from(
      ...>    Util.Location.new(42.0001, -71.0002),
      ...>    Util.Location.new(42, -71.0002)
      ...> )
      %Util.Vector2d{x: 0.0, y: 11.119508023696506}

  If the displacement is south and/or west, then the `x` or `y` coordinate will be negative

  ## Example
      iex> Util.Location.displacement_from(
      ...>    Util.Location.new(42.0001, -71.0002),
      ...>    Util.Location.new(42.0002, -71.0001)
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
      ...>    Util.Location.new(42.0, -71.0),
      ...>    %Util.Vector2d{x: 10.0, y: 0.0}
      ...> )
      %Util.Location{latitude: 42.0, longitude: -70.99987898450841}

      iex> Util.Location.displace_by(
      ...>    Util.Location.new(42.0, -71.0),
      ...>    %Util.Vector2d{x: 0.0, y: 10.0}
      ...> )
      %Util.Location{latitude: 42.000089932036374, longitude: -71.0}

  Negative values of `x` and `y` correspond to west and south displacements.

  ## Example
      iex> Util.Location.displace_by(
      ...>    Util.Location.new(42.0, -71.0),
      ...>    %Util.Vector2d{x: -10.0, y: -10.0}
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
  Returns the nearest point on the segment given by the second
  argument (as a tuple of its two endpoints) to the point given by
  the first argument.

  ## Examples
      iex> Util.Location.nearest_point_to_segment(
      ...>   Util.Location.new(42.00004, -71.00014),
      ...>   {Util.Location.new(42, -71.0002), Util.Location.new(42.0001, -71.0001)}
      ...> )
      %Util.Location{latitude: 42.00004711559566, longitude: -71.00015288440434}
  """
  @spec nearest_point_to_segment(
          point :: __MODULE__.From.t(),
          {segment_start :: __MODULE__.From.t(), segment_end :: __MODULE__.From.t()}
        ) :: __MODULE__.t()

  def nearest_point_to_segment(
        %__MODULE__{} = point,
        {%__MODULE__{} = start_loc, %__MODULE__{} = end_loc}
      ) do
    # Most of this algorithm deals with vectors, displacements from
    # start_loc represented as coordinates (Δx, Δy), where Δx is
    # meters east of start_loc, and Δy is meters north of start_loc.
    #
    # In broad strokes, if the nearest point we're looking for is
    # called N, and start_loc is called S, then we start by converting
    # everything to vectors, using the input data to find the vector
    # S->N, and then using that to find the lat/long coordinates of N
    # itself.
    #
    #                    P <-- "point"
    #                   /
    #                  /   /---- nearest point (what we're looking for)
    #                 /   /
    #  start_loc --> S---N----E <-- end_loc
    #

    # We start by converting start_loc, end_loc, and point into
    # vectors. Location.displacement_from/2 will take two points E and
    # S (in that order) and return the vector S->E.
    #
    # segment_vector is the vector S->E
    # point_vector is the vector S->P
    #
    # We don't compute it because we don't need to, but
    # Vector2d.zero(), which equals (0.0, 0.0) is a vector pointing
    # from S to itself (S->S).

    segment_vector = displacement_from(end_loc, start_loc)
    point_vector = displacement_from(point, start_loc)

    # nearest_vector below is the vector S->N, and much of the rest of
    # this algorithm is devoted to figuring out what its value is.
    #
    # Once we find S->N (nearest_vector), finding N is quite easy.
    nearest_vector =
      case Vector2d.dot_product(segment_vector, segment_vector) do
        # If the start and end points coincide then the formula for
        # the condition below doesn't work (there's a division-by-zero
        # under the hood). Fortunately, there's an easy answer
        # here. We're trying to find a point on the segment S--E, and
        # if S and E are the same point, then there's only one
        # possible point.
        #
        #       P
        #      /
        #     /
        #    /
        #  SNE
        #
        # S->N is zero, so that's what we assign to nearest_vector.
        0.0 ->
          Vector2d.zero()

        # If the start and end points don't coincide, then we can
        # project the vector S->P onto the line containing the segment
        # S--E. We'll call the new projected vector S->Q (and the tip
        # of that new vector Q). We can use S->Q to find S->N. Notice
        # that Q doesn't always fall onto the actual segment, because
        # the segment doesn't go on forever.
        #
        #           P                           P
        #          /                             \
        #         /                               \
        #        /                                 \
        #       S---Q----E                      Q   S--------E
        #
        # projected_vector is the vector S->Q
        squared_segment_length ->
          projected_vector = Vector2d.project_onto(point_vector, segment_vector)

          # We can find out whether projected_vector falls on the
          # segment, or "off" in one direction or the other, by taking
          # the dot product of projected_vector and segment_vector,
          # and comparing it to the square of the segment length.
          case Vector2d.dot_product(projected_vector, segment_vector) do
            # If the dot product is larger than
            # squared_segment_length, then projected_vector is longer
            # than the segment, which means it falls off on the side
            # closer to the end-point. Notice that in the diagram
            # below, N (the nearest point) sticks to E so that it
            # stays on the segment S--E, so S->N (nearest_vector) is
            # the same as S->E (segment_vector)
            #
            #             P
            #        ____/
            #   ____/      <-- (please forgive the ASCII art wiggles)
            #  /
            # S-------EN  Q
            #
            p when p > squared_segment_length ->
              segment_vector

            # If the dot product is negative, then that means the
            # projected vector points in the opposite direction from
            # the segment vector, so the closest point on the segment
            # is the start-point. Notice that in the diagram below, N
            # (the nearest point) sticks to S so that it stays on the
            # segment S--E, so S->N (nearest_vector) is the same as
            # S->S, or the zero vector.
            #
            #  P
            #   \
            #    \
            #     \
            #  Q  NS--------E
            #
            p when p < 0 ->
              Vector2d.zero()

            # If the dot product is between zero and
            # squared_segment_length, then that means the projected
            # vector will fall onto the segment there. For example, in
            # the diagram below, Q itself is the closest point we're
            # looking for, which means that S->Q (projected_vector)
            # is the same as S->N (nearest_vector).
            #
            #      P
            #     /
            #    /
            #   /
            #  S---QN----E
            #
            _ ->
              projected_vector
          end
      end

    # Now that we have S->N (nearest_vector), we can use displace_by
    # to combine that with S itself (start_loc) to get the nearest
    # point we're looking for, N.
    displace_by(start_loc, nearest_vector)
  end

  def nearest_point_to_segment(point, {segment_start, segment_end}) do
    nearest_point_to_segment(
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
