defmodule Util.NearestPoint do
  @moduledoc """
  A module containing some functions that find the closest points of some
  shapes to other points on the globe.
  """

  alias Util.Location
  alias Util.Vector2d

  @doc """
  Returns the nearest point on the segment given by the second
  argument (as a tuple of its two endpoints) to the point given by
  the first argument.

  ## Examples
      iex> NearestPoint.nearest_point_on_segment(
      ...>   Location.new(42.00004, -71.00014),
      ...>   {Location.new(42, -71.0002), Location.new(42.0001, -71.0001)}
      ...> )
      %Location{latitude: 42.00004711559566, longitude: -71.00015288440434}
  """
  @spec nearest_point_on_segment(
          point :: Location.From.t(),
          {segment_start :: Location.From.t(), segment_end :: Location.From.t()}
        ) :: Location.t()

  def nearest_point_on_segment(
        %Location{} = point,
        {%Location{} = start_loc, %Location{} = end_loc}
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

    segment_vector = Location.displacement_from(end_loc, start_loc)
    point_vector = Location.displacement_from(point, start_loc)

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

    # Now that we have S->N (nearest_vector), we can use
    # Location.displace_by to combine that with S itself (start_loc)
    # to get the nearest point we're looking for, N.
    Location.displace_by(start_loc, nearest_vector)
  end

  def nearest_point_on_segment(point, {segment_start, segment_end}) do
    nearest_point_on_segment(
      Location.as_location!(point),
      {Location.as_location!(segment_start), Location.as_location!(segment_end)}
    )
  end

  @doc """
  Computes the nearest point on the shape given by the first argument
  (as a list of the points on the shape) to the point given by the second
  argument, and returns a tuple containing the nearest point as well as the
  index indicating which segment the nearest point is on.

  ## Examples
      iex> NearestPoint.nearest_point_on_shape(
      ...>   [
      ...>     Location.new(42, -71.0002),
      ...>     Location.new(42.0001, -71.0001),
      ...>     Location.new(42.0002, -71.0002)
      ...>   ],
      ...>   Location.new(42.00004, -71.00014)
      ...> )
      {
        %Location{latitude: 42.00004711559566, longitude: -71.00015288440434},
        0
      }

      iex> NearestPoint.nearest_point_on_shape(
      ...>   [
      ...>     Location.new(42, -71.0002),
      ...>     Location.new(42.0001, -71.0001),
      ...>     Location.new(42.0002, -71.0002)
      ...>   ],
      ...>   Location.new(42.00014, -71.00004)
      ...> )
      {
        %Location{latitude: 42.00010442209373, longitude: -71.00010442209373},
        1
      }
  """
  @spec nearest_point_on_shape(
          nonempty_list(Util.Location.From.t()),
          Util.Location.From.t()
        ) :: {Util.Location.t(), integer()}
  def nearest_point_on_shape(shape, point) do
    shape
    |> Enum.chunk_every(2, 1, :discard)
    |> Enum.map(fn [segment_start, segment_end] ->
      nearest_point_on_segment(point, {segment_start, segment_end})
    end)
    |> Enum.with_index()
    |> Enum.min_by(fn {nearest_point, _} -> Util.Location.distance(nearest_point, point) end)
  end
end
