defmodule Swiftly.Api.RequestTest do
  use Skate.DataCase
  import Skate.Factory
  import ExUnit.CaptureLog

  import Swiftly.Api.Requests
  alias Swiftly.Api.Requests.{CreateAdjustmentRequestV1, DetourV0CreationDetailsV1}

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
        |> with_direction(:inbound)
        |> with_coordinates()
        |> activated(~U[2025-03-27 12:45:00.00Z])
        |> insert()

      detour = get_detour_with_all_virtual_fields(detour.id)

      assert {:ok,
              %CreateAdjustmentRequestV1{
                feedId: "TEMP_FEED_ID",
                feedName: "TEMP_FEED_NAME",
                notes: notes,
                details: %DetourV0CreationDetailsV1{
                  adjustmentType: :DETOUR_V0,
                  beginTime: "2025-03-27T08:45:00.000000-04:00",
                  detourRouteDirectionDetails: [
                    %{
                      routeShortName: "test_route_id",
                      direction: "1",
                      shape: [
                        [42.337949, -71.074936],
                        [42.338488, -71.066487],
                        [42.339672, -71.067018],
                        [42.339848, -71.067554],
                        [42.340134, -71.068427],
                        [42.340216, -71.068579]
                      ]
                    }
                  ]
                }
              }} = to_swiftly(detour)

      assert notes == Integer.to_string(detour.id)
    end

    test "it returns :error if detour provided is not :active and logs a warning for :draft" do
      detour =
        build(:detour)
        |> with_route(%{name: "test_route_name", id: "test_route_id"})
        |> with_direction(:inbound)
        |> with_coordinates()
        |> insert()

      detour = get_detour_with_all_virtual_fields(detour.id)

      log =
        capture_log(fn ->
          assert :error = to_swiftly(detour)
        end)

      assert log =~ "detour_not_active_to_swiftly detour_id=#{detour.id} status=:draft"
    end
  end

  test "it returns :error if detour provided is not :active and logs a warning for :past" do
    detour =
      build(:detour)
      |> with_route(%{name: "test_route_name", id: "test_route_id"})
      |> with_direction(:inbound)
      |> with_coordinates()
      |> activated()
      |> deactivated()
      |> insert()

    detour = get_detour_with_all_virtual_fields(detour.id)

    log =
      capture_log(fn ->
        assert :error = to_swiftly(detour)
      end)

    assert log =~ "detour_not_active_to_swiftly detour_id=#{detour.id} status=:past"
  end
end
