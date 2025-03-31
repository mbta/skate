defmodule Swiftly.API.ServiceAdjustments.Coordinate do
  @moduledoc """
  A typespec for Swiftly's Geographic Coordinate pairs.

  The order is important, so this is created as a typespec to help name and
  enforce which element in the list is which axis.

  The projection is unspecified in the API documentation, so the assumption is
  that it is the same as GTFS, which GTFS uses WGS-84.
  """
  @type t :: [(latitude :: number()) | (longitude :: number())]
end
