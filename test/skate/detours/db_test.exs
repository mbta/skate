defmodule Skate.Detours.DbTest do
  use Skate.DataCase
  import Skate.Factory

  alias Skate.Detours.Detours

  describe "detours" do
    alias Skate.Detours.Db.Detour

    defp detour_fixture do
      insert(:detour)
    end

    test "list_detours/0 returns all detours" do
      %{id: id} = detour_fixture()
      assert [%{id: ^id}] = Skate.Repo.preload(Detours.list_detours(), :author)
    end

    test "get_detour!/1 returns the detour with given id" do
      detour = detour_fixture()

      assert detour.id
             |> Detours.get_detour!()
             |> Skate.Repo.preload(:author) == detour
    end

    test "get_detour_for_user!/2 returns the detour with the given detour id and author_id" do
      detour = detour_fixture()

      assert detour.id
             |> Detours.get_detour_for_user!(detour.author_id)
             |> Skate.Repo.preload(:author) == detour

      assert %Ecto.NoResultsError{} =
               catch_error(Detours.get_detour_for_user!(detour.id, detour.author_id + 1))
    end

    test "delete_detour/1 deletes the detour" do
      detour = detour_fixture()
      assert {:ok, %Detour{}} = Detours.delete_detour(detour)
      assert_raise Ecto.NoResultsError, fn -> Detours.get_detour!(detour.id) end
    end

    test "change_detour/1 returns a detour changeset" do
      detour = detour_fixture()
      assert %Ecto.Changeset{} = Detours.change_detour(detour)
    end

    test "change_detour/1 does not allow a non-nil activated_at column to be updated with nil" do
      detour = detour_fixture()

      activated_at = DateTime.to_iso8601(Skate.DetourFactory.browser_date())

      changeset = Detours.change_detour(detour, %{"activated_at" => activated_at})
      assert {:ok, _} = fetch_change(changeset, :activated_at)

      assert :error =
               changeset
               |> Map.get(:data)
               |> Detours.change_detour(%{"activated_at" => nil})
               |> fetch_change(:activated_at)
    end

    test "change_detour/1 changes :status when :state updates" do
      detour_snapshot = build(:detour_snapshot)

      assert %Detour{status: nil} =
               detour =
               build(:detour, status: nil, state: nil)

      {:ok, draft_detour} =
        detour
        |> Detours.change_detour(%{state: detour_snapshot})
        |> Ecto.Changeset.apply_action(:update)

      assert %Detour{status: :draft} = draft_detour

      {:ok, active_detour} =
        draft_detour
        |> Detours.change_detour(%{state: activated(draft_detour.state)})
        |> Ecto.Changeset.apply_action(:update)

      assert %Detour{status: :active} = active_detour

      {:ok, past_detour} =
        active_detour
        |> Detours.change_detour(%{state: deactivated(active_detour.state)})
        |> Ecto.Changeset.apply_action(:update)

      assert %Detour{status: :past} = past_detour
    end
  end
end
