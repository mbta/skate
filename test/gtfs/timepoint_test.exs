defmodule Gtfs.TimepointTest do
  use ExUnit.Case, async: true

  alias Gtfs.Timepoint

  @csv_row %{
    "checkpoint_id" => "mport",
    "checkpoint_name" => "Main & Porter"
  }

  describe "from_csv_row/1" do
    test "builds a trip stops map from a list of stop time csv rows" do
      assert Timepoint.from_csv_row(@csv_row) == %Timepoint{
               id: "mport",
               name: "Main & Porter"
             }
    end
  end
end
