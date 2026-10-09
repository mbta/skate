defmodule Skate.Detours.DetourTest do
  use ExUnit.Case, async: true

  alias Skate.Detours.Detour.Report
  import Skate.Factory

  describe "Report.from!/1" do
    setup do
      detour =
        build(:detour,
          id: 123,
          route_id: "39",
          reason: "Construction",
          estimated_duration: "1 hour",
          activated_at: ~U[2026-10-09 12:00:00Z],
          updated_at: ~N[2026-10-09 12:30:00],
          direction_id: 0,
          missed_stops: [],
          connection_points: %{"start" => %{"id" => "101"}},
          typed_detour: %{
            "missedStops" => "Stops along Main Street",
            "connectionPoints" => "Main Street and First Avenue"
          }
        )

      {:ok, detour: detour}
    end

    for is_text_only <- [false, true], nearest_intersection <- ["Main Street", nil] do
      @is_text_only is_text_only
      @nearest_intersection nearest_intersection

      test "returns common field types with is_text_only=#{is_text_only} and nearest_intersection=#{inspect(nearest_intersection)}",
           %{detour: detour} do
        detour = %{
          detour
          | is_text_only: @is_text_only,
            nearest_intersection: @nearest_intersection
        }

        assert %Report{} = report = Report.from!(detour)
        assert is_integer(report.id)
        assert report.id == detour.id

        for field <- [:route_id, :reason, :estimated_duration] do
          assert is_binary(Map.fetch!(report, field))
          assert String.length(Map.fetch!(report, field)) > 0
          assert Map.fetch!(report, field) == Map.fetch!(detour, field)
        end

        assert is_nil(report.nearest_intersection) or is_binary(report.nearest_intersection)
        assert report.nearest_intersection == @nearest_intersection
        assert is_integer(report.activated_at)
        assert report.activated_at == 1_791_547_200
        assert is_integer(report.updated_at)
        assert report.updated_at == 1_791_549_000
        assert is_integer(report.direction_id)
        assert report.direction_id == detour.direction_id
      end
    end

    for missed_stop_ids <- [[], ["201", "202"]],
        connection_stop_ids <- [["101"], ["101", "102"]] do
      @missed_stop_ids missed_stop_ids
      @connection_stop_ids connection_stop_ids

      test "returns standard detour fields with #{length(missed_stop_ids)} missed stops and #{length(connection_stop_ids)} connection points",
           %{detour: detour} do
        connection_points =
          ["start", "end"]
          |> Enum.zip(@connection_stop_ids)
          |> Map.new(fn {position, stop_id} -> {position, %{"id" => stop_id}} end)

        detour = %{
          detour
          | is_text_only: false,
            missed_stops: Enum.map(@missed_stop_ids, &%{"id" => &1}),
            connection_points: connection_points
        }

        report = Report.from!(detour)

        assert is_list(report.missed_stops)
        assert Enum.all?(report.missed_stops, &is_binary/1)
        assert report.missed_stops == @missed_stop_ids
        assert is_list(report.connection_points)
        assert length(report.connection_points) in [1, 2]
        assert Enum.all?(report.connection_points, &is_binary/1)
        assert report.connection_points == @connection_stop_ids
        assert is_nil(report.missed_stops_text_only)
        assert is_nil(report.connection_points_text_only)
      end
    end

    test "returns standard route segments as arrays of latitude/longitude objects", %{
      detour: detour
    } do
      # Note: in the real data the route segments contain many points, not just one.
      # The one point here is just for validating the structure of the route segment.
      route_segments = %{
        "beforeDetour" => [
          %{"lat" => 42.299951, "lon" => -71.061458},
          %{"lat" => 42.323284, "lon" => -71.073486}
        ],
        "afterDetour" => [
          %{"lat" => 42.299951, "lon" => -71.061458},
          %{"lat" => 42.323284, "lon" => -71.073486}
        ],
        "detour" => [
          %{"lat" => 42.299951, "lon" => -71.061458},
          %{"lat" => 42.323284, "lon" => -71.073486}
        ]
      }

      bypassed_segment = [
        %{"lat" => 42.299951, "lon" => -71.061458},
        %{"lat" => 42.323284, "lon" => -71.073486}
      ]

      report =
        Report.from!(%{
          detour
          | is_text_only: false,
            route_segments: route_segments,
            detour_shape: %{"ok" => %{"coordinates" => bypassed_segment}}
        })

      assert is_map(report.route_segments)

      assert report.route_segments == %{
               before_detour: route_segments["beforeDetour"],
               after_detour: route_segments["afterDetour"],
               bypassed_segment: bypassed_segment,
               detour_segment: route_segments["detour"]
             }

      for field <- [:before_detour, :after_detour, :bypassed_segment, :detour_segment] do
        coordinates = Map.fetch!(report.route_segments, field)
        assert is_list(coordinates)

        for coordinate <- coordinates do
          assert %{"lat" => latitude, "lon" => longitude} = coordinate
          assert is_number(latitude)
          assert is_number(longitude)
        end
      end
    end

    test "allows absent route segments for standard detours", %{detour: detour} do
      report = Report.from!(%{detour | is_text_only: false, route_segments: nil})

      assert is_nil(report.route_segments)
    end

    test "returns text-only fields without standard detour data", %{detour: detour} do
      report = Report.from!(%{detour | is_text_only: true})

      assert is_binary(report.missed_stops_text_only)
      assert report.missed_stops_text_only == detour.typed_detour["missedStops"]
      assert is_binary(report.connection_points_text_only)
      assert report.connection_points_text_only == detour.typed_detour["connectionPoints"]
      assert is_nil(report.missed_stops)
      assert is_nil(report.connection_points)
      assert is_nil(report.route_segments)
    end

    for is_text_only <- [true, false],
        {copied_from_id, expected_type} <- [{12_345, :integer}, {nil, nil}] do
      @is_text_only is_text_only
      @copied_from_id copied_from_id
      @expected_type expected_type

      test "populates copied_from=#{inspect(copied_from_id)} when is_text_only=#{is_text_only}" do
        detour =
          build(
            :detour,
            copied_from_id: @copied_from_id,
            is_text_only: @is_text_only,
            activated_at: DateTime.utc_now(),
            updated_at: NaiveDateTime.utc_now()
          )

        detour =
          if @is_text_only do
            detour
          else
            with_finished_state(detour, missed_stops: ["101", "102"])
          end

        assert %Report{} = report = Report.from!(detour)
        assert report.copied_from == @copied_from_id

        case @expected_type do
          :integer -> assert is_integer(report.copied_from)
          nil -> assert is_nil(report.copied_from)
        end
      end
    end
  end
end
