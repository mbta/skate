defmodule Skate.Detours.SnapshotSerdeTest do
  use Skate.DataCase
  import Skate.Factory
  import ExUnit.CaptureLog

  alias Skate.Detours.SnapshotSerde

  describe "compare_snapshots" do
    test "true: compares activated_at prop with activatedAt in serialized detour snapshot" do
      activated_at = Skate.DetourFactory.browser_date()

      %{id: id, state: snapshot} =
        detour =
        :detour
        |> build()
        |> activated(activated_at)
        |> insert()

      snapshot = with_id(snapshot, id)

      {_value, snapshot} = pop_in(snapshot["context"]["activatedAt"])

      detour =
        detour
        |> Skate.Detours.Detours.change_detour(%{state: snapshot})
        |> Skate.Repo.update!()

      assert {true, _} = SnapshotSerde.compare_snapshots(detour)
    end

    test "true: compares activatedAt stored in state prop with activatedAt in serialized detour snapshot" do
      activated_at = Skate.DetourFactory.browser_date()

      %{id: id, state: snapshot} =
        detour =
        :detour
        |> build()
        |> activated(activated_at)
        |> insert()

      # Make ID match snapshot
      snapshot = with_id(snapshot, id)

      detour =
        detour
        |> Skate.Detours.Detours.change_detour(%{state: snapshot})
        |> Skate.Repo.update!()

      assert {true, _} = SnapshotSerde.compare_snapshots(detour)
    end

    test "true: compares activatedAt stored in state prop with activatedAt in serialized detour snapshot, defer to prop level vaule" do
      activated_at = Skate.DetourFactory.browser_date()
      later_activated_at = Skate.DetourFactory.browser_date(DateTime.add(activated_at, 1, :hour))

      %{id: id, state: snapshot} =
        detour =
        :detour
        |> build()
        |> activated(activated_at)
        |> insert()

      snapshot = with_id(snapshot, id)
      put_in(snapshot, ["context", "activatedAt"], later_activated_at)

      detour =
        detour
        |> Skate.Detours.Detours.change_detour(%{state: snapshot})
        |> Skate.Repo.update!()

      assert {true, _} = SnapshotSerde.compare_snapshots(detour)
    end

    test "returns true when state snapshot matches serialized snapshot" do
      %{id: id, state: snapshot} =
        detour =
        :detour
        |> build()
        |> insert()

      snapshot = with_id(snapshot, id)

      detour =
        detour
        |> Skate.Detours.Detours.change_detour(%{state: snapshot})
        |> Skate.Repo.update!()

      assert {true, _} = SnapshotSerde.compare_snapshots(detour)
    end

    test "returns true when state snapshot matches serialized snapshot even with extra, untracked fields in state snapshot" do
      %{id: id, state: snapshot} =
        detour =
        :detour
        |> build()
        |> insert()

      snapshot = with_id(snapshot, id)
      put_in(snapshot, ["context", "extraField"], "irrelevant data")

      detour =
        detour
        |> Skate.Detours.Detours.change_detour(%{state: snapshot})
        |> Skate.Repo.update!()

      assert {true, _} = SnapshotSerde.compare_snapshots(detour)
    end
  end

  describe "log_fallback_summary/2 (via serialize_snapshot fallback aggregation)" do
    @tag :capture_log
    test "logs a single aggregated warning listing every field that fell back to the snapshot" do
      # A bare build+insert skips `Detour.changeset/2`'s `populate_fields_from_state/1`,
      # so `state_value`, `route`-related, and `snapshot_children` columns are left
      # unpopulated and their `*_from_detour/1` fallback clauses fire.
      %{id: id, author_id: author_id} =
        detour =
        :detour
        |> build()
        |> insert()

      log =
        capture_log(fn ->
          SnapshotSerde.compare_snapshots(detour)
        end)

      assert log =~
               "Unexpected detour structure for detour_id=#{id} author_id=#{author_id}. " <>
                 "Using snapshot for fields: state, route, routePattern, children"

      assert length(String.split(log, "Unexpected detour structure")) == 2
    end

    @tag :capture_log
    test "logs nothing when no fields fall back to the snapshot" do
      %{id: id, state: snapshot} =
        detour =
        :detour
        |> build()
        |> insert()

      snapshot =
        snapshot
        |> with_id(id)
        |> put_in(["context", "route", "garages"], ["garage-a"])
        |> put_in(["context", "routePatterns"], [])

      detour =
        detour
        |> Skate.Detours.Detours.change_detour(%{state: snapshot})
        |> Skate.Repo.update!()

      log =
        capture_log(fn ->
          SnapshotSerde.compare_snapshots(detour)
        end)

      refute log =~ "Unexpected detour structure"
    end
  end
end
