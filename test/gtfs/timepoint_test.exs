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

  describe "timpoint_for_id/2" do
    setup do
      timepoint = %Timepoint{
        id: "t1",
        name: "t1 name"
      }

      timepoints_by_id = %{
        "t1" => timepoint
      }

      {:ok, %{timepoints_by_id: timepoints_by_id, timepoint: timepoint}}
    end

    test "retrieves a timepoint from a collection", %{
      timepoints_by_id: timepoints_by_id,
      timepoint: timepoint
    } do
      assert Timepoint.timepoint_for_id(timepoints_by_id, "t1") == timepoint
    end

    test "returns a timepoint with no name if the ID does not exist in the collection", %{
      timepoints_by_id: timepoints_by_id
    } do
      assert Timepoint.timepoint_for_id(timepoints_by_id, "missing") == %Timepoint{id: "missing"}
    end
  end
end
