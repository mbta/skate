defmodule Skate.Detours.SnapshotSerdeTest do
  use Skate.DataCase
  import Skate.Factory

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
end
