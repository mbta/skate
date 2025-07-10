defmodule Swiftly.Api.RequestTest do
  use Skate.DataCase
  import Skate.Factory

  import Swiftly.API.Requests
  alias Swiftly.API.ServiceAdjustments.{CreateAdjustmentRequestV1, DetourV0CreationDetailsV1}

  defp get_detour_with_all_virtual_fields(id) do
    [detour] =
      Repo.all(
        Skate.Detours.Db.Detour.Queries.select_fields(
          from(d in Skate.Detours.Db.Detour, as: :detour, where: d.id == ^id),
          :all
        )
      )

    detour
  end

  describe "to_swiftly" do
    test "it translates an active detour to the format expected by swiftly" do
      detour =
        build(:detour)
        |> with_route(%{name: "test_route_name", id: "test_route_id"})
        |> with_missed_stops(["skipped1", "skipped2"])
        |> with_direction(:inbound)
        |> with_coordinates()
        |> activated(~U[2025-03-27 12:45:00.00Z])
        |> insert()

      detour = get_detour_with_all_virtual_fields(detour.id)

      assert {:ok,
              %CreateAdjustmentRequestV1{
                feedId: nil,
                feedName: nil,
                notes: notes,
                details: %DetourV0CreationDetailsV1{
                  adjustmentType: :DETOUR_V0,
                  beginTime: "2025-03-27T08:45:00.000000-04:00",
                  detourRouteDirectionDetails: [
                    %{
                      routeShortName: "test_route_name",
                      direction: "1",
                      shape: [
                        [42.337949, -71.074936],
                        [42.338488, -71.066487],
                        [42.339672, -71.067018],
                        [42.339848, -71.067554],
                        [42.340134, -71.068427],
                        [42.340216, -71.068579]
                      ],
                      skippedStops: ["skipped1", "skipped2"]
                    }
                  ]
                }
              }} = to_swiftly(detour)

      assert notes == Integer.to_string(detour.id)
    end

    test "it translates an active detour to the format expected by swiftly, no skipped stops" do
      detour =
        build(:detour)
        |> with_route(%{name: "test_route_name", id: "test_route_id"})
        |> with_direction(:inbound)
        |> with_coordinates()
        |> activated(~U[2025-03-27 12:45:00.00Z])
        |> insert()

      detour = get_detour_with_all_virtual_fields(detour.id)

      assert {:ok,
              %CreateAdjustmentRequestV1{
                feedId: nil,
                feedName: nil,
                notes: notes,
                details: %DetourV0CreationDetailsV1{
                  adjustmentType: :DETOUR_V0,
                  beginTime: "2025-03-27T08:45:00.000000-04:00",
                  detourRouteDirectionDetails: [
                    %{
                      routeShortName: "test_route_name",
                      direction: "1",
                      shape: [
                        [42.337949, -71.074936],
                        [42.338488, -71.066487],
                        [42.339672, -71.067018],
                        [42.339848, -71.067554],
                        [42.340134, -71.068427],
                        [42.340216, -71.068579]
                      ],
                      skippedStops: []
                    }
                  ]
                }
              }} = to_swiftly(detour)

      assert notes == Integer.to_string(detour.id)
    end
  end
end
