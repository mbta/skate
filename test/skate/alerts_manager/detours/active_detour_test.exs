defmodule Skate.AlertsManager.Detours.ActiveDetour.Test do
  use ExUnit.Case

  alias Skate.AlertsManager.Detours.ActiveDetour

  @attrs %{
    id: 7,
    route_id: "1",
    reason: "Accident",
    nearest_intersection: "Massachusetts Avenue & Western Avenue",
    estimated_duration: "2026-04-14",
    activated_at: 1775501059,
    updated_at: 1775741879,
    direction_id: 1,
    missed_stops: ["72"],
    connection_points: ["71", "73"],
    route_segments: %{
      before_detour: [
        %{"lat" => 42.37304, "lon" => -71.117686},
        %{"lat" => 42.373096, "lon" => -71.117908},
      ],
      after_detour: [
        %{"lat" => 42.358975, "lon" => -71.093537},
        %{"lat" => 42.358877, "lon" => -71.093476},
      ],
      bypassed_segment: [
        %{"lat" => 42.365601, "lon" => -71.104053},
        %{"lat" => 42.365547, "lon" => -71.103954},
      ],
      detour_segment: [
        %{"lat" => 42.365733, "lon" => -71.104244},
        %{"lat" => 42.365588, "lon" => -71.104},
      ],
    }
  }

  describe "casts valid map" do
    test "with all fields" do
      attrs = @attrs

      changeset = %ActiveDetour{}
      |> ActiveDetour.changeset(attrs)

      assert changeset.valid?
    end

    test "with only required fields" do
      attrs = @attrs
      |> Map.delete(:nearest_intersection)

      changeset = %ActiveDetour{}
      |> ActiveDetour.changeset(attrs)

      assert changeset.valid?
    end
  end

  describe "rejects invalid map missing required field" do
    for field <- [
      :id,
      :route_id,
      :reason,
      # :nearest_intersection
      :estimated_duration,
      :activated_at,
      :updated_at,
      :direction_id,
      :missed_stops,
      :connection_points,
      :route_segments
    ] do
      @tag field: field
      test "'#{field}'", %{field: field} do
        attrs = @attrs
        |> Map.delete(field)

        changeset = %ActiveDetour{}
        |> ActiveDetour.changeset(attrs)

        refute changeset.valid?
      end
    end
  end

  describe "rejects invalid map with nil required field" do
    for field <- [
      :id,
      :route_id,
      :reason,
      # :nearest_intersection
      :estimated_duration,
      :activated_at,
      :updated_at,
      :direction_id,
      :missed_stops,
      :connection_points,
      :route_segments
    ] do
      @tag field: field
      test "'#{field}'", %{field: field} do
        attrs = @attrs
        |> Map.replace(field, nil)

        changeset = %ActiveDetour{}
        |> ActiveDetour.changeset(attrs)

        refute changeset.valid?
      end
    end
  end

  describe "rejects invalid map with empty string required field" do
    for field <- [:route_id, :reason, :estimated_duration] do
      @tag field: field
      test "'#{field}'", %{field: field} do
        attrs = @attrs
        |> Map.replace(field, "")

        changeset = %ActiveDetour{}
        |> ActiveDetour.changeset(attrs)

        refute changeset.valid?
      end
    end
  end

  describe "rejects invalid map with empty array required field" do
    for field <- [:connection_points] do
      @tag field: field
      test "'#{field}'", %{field: field} do
        attrs = @attrs
        |> Map.replace(field, [])

        changeset = %ActiveDetour{}
        |> ActiveDetour.changeset(attrs)

        refute changeset.valid?
      end
    end
  end
end
