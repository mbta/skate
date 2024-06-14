defmodule Skate.Detours.TripModificationTest do
  use ExUnit.Case
  alias Skate.Detours.TripModification

  doctest TripModification

  defmodule Input do
    @moduledoc false
  end

  test "can take detour info" do
    TripModification.for()
  end
end
