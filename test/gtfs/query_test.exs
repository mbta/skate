defmodule Gtfs.QueryTest do
  use ExUnit.Case, async: true

  alias Gtfs.Stop

  alias Gtfs.Query

  describe "all_stops" do
    test "all_stops" do
      {:ok, pid} =
        Gtfs.start_mocked(%{
          "stops.txt" => [
            "stop_id,stop_name",
            "place-sstat,South Station"
          ]
        })

      assert Query.all_stops(server: pid) == [
               %Stop{id: "place-sstat"}
             ]
    end
  end
end
