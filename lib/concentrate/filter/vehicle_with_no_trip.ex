defmodule Concentrate.Filter.VehicleWithNoTrip do
  @moduledoc """
  Rejects vehicles which don't have a trip ID.
  """
  alias Concentrate.VehiclePosition
  @behaviour Concentrate.Filter

  @impl Concentrate.Filter
  def filter(%VehiclePosition{} = vp) do
    if VehiclePosition.trip_id(vp) do
      {:cont, vp}
    else
      :skip
    end
  end

  def filter(other) do
    {:cont, other}
  end
end
