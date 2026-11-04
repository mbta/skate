defmodule Skate.Detours.SnapshotSerdeTest do
  use Skate.DataCase

  import ExUnit.CaptureLog
  import Skate.Factory

  alias Skate.Detours.SnapshotSerde

  describe "deserialize/2" do
    test "extracts activatedAt into the detour changeset and keeps snapshot state clean" do
      activated_at = Skate.DetourFactory.browser_date()

      snapshot =
        :detour_snapshot
        |> build()
        |> with_id(42)
        |> put_in(["context", "activatedAt"], DateTime.to_iso8601(activated_at))

      changeset = SnapshotSerde.deserialize(99, snapshot)

      assert changeset.data.author_id == 99
      assert DateTime.compare(changeset.changes[:activated_at], activated_at) == :eq
      assert get_in(changeset.changes.state, ["context", "activatedAt"]) == nil
      assert get_in(changeset.changes.state, ["value", "SaveState"]) == "Saved"
    end

    test "uses the existing detour record when the snapshot uuid matches a DB detour" do
      detour =
        :detour
        |> build()
        |> Map.put(:id, 77)
        |> insert()

      snapshot =
        :detour_snapshot
        |> build()
        |> with_id(detour.id)

      changeset = SnapshotSerde.deserialize(detour.author_id, snapshot)

      assert changeset.data.id == detour.id
      assert changeset.data.author_id == detour.author_id
      assert get_in(changeset.changes.state, ["context", "uuid"]) == detour.id
    end
  end

  describe "serialize/1" do
    test "serializes detour fields from persisted DB columns" do
      activated_at = Skate.DetourFactory.browser_date()

      detour =
        :detour
        |> build()
        |> activated(activated_at)
        |> insert()

      snapshot = SnapshotSerde.serialize(detour)

      assert get_in(snapshot, ["context", "activatedAt"]) ==
               DateTime.to_iso8601(DateTime.truncate(activated_at, :millisecond))

      assert get_in(snapshot, ["context", "routePattern"]) == detour.route_pattern
      assert get_in(snapshot, ["context", "selectedDuration"]) == detour.estimated_duration
    end

    test "uses the persisted estimated duration when present" do
      detour =
        :detour
        |> build()
        |> Map.put(:estimated_duration, "2 hours")
        |> Map.put(:state, put_in(build(:detour_snapshot), ["context", "selectedDuration"], "2 hours"))
        |> insert()

      snapshot = SnapshotSerde.serialize(detour)

      assert get_in(snapshot, ["context", "selectedDuration"]) == "2 hours"
    end

    test "falls back to 'Until further notice' for active detours without a persisted duration" do
      detour =
        :detour
        |> build()
        |> Map.put(:status, :active)
        |> Map.put(:estimated_duration, nil)

      log =
        capture_log(fn ->
          snapshot = SnapshotSerde.serialize(detour)
          assert get_in(snapshot, ["context", "selectedDuration"]) == "Until further notice"
        end)

      assert log =~ "selectedDuration is nil in active detour"
    end
  end
end
