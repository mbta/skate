defmodule Concentrate.MergeTest do
  @moduledoc false
  use ExUnit.Case, async: true

  alias Concentrate.Merge

  describe "group_by_id" do
    test "makes a dict where each vehicle has its sources" do
      vehicles_by_source = %{
        "source1" => %{
          "1" => "source1v1",
          "2" => "source1v2"
        },
        "source2" => %{
          "2" => "source2v2",
          "3" => "source2v3"
        }
      }

      assert Merge.group_by_id(vehicles_by_source) == %{
               "1" => %{
                 "source1" => "source1v1",
                 "source2" => nil
               },
               "2" => %{
                 "source1" => "source1v2",
                 "source2" => "source2v2"
               },
               "3" => %{
                 "source1" => nil,
                 "source2" => "source2v3"
               }
             }
    end
  end
end
