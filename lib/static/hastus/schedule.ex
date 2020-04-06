defmodule Static.Hastus.Schedule do
  @moduledoc """
  A HASTUS schedule id refers to the same idea as a GTFS service id:
  a particular version of service that determines what trips run on a day:
  But the ids are incompatible between HASTUS and GTFS,
  so they get different types so it's clear they aren't interchangable.
  """
  @type id :: String.t()
end
