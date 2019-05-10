defmodule Concentrate.Alert do
  @moduledoc """
  Structure for representing service alerts.
  """
  import Concentrate.StructHelpers

  defstruct_accessors([
    :id,
    :effect,
    active_period: [],
    informed_entity: []
  ])
end
