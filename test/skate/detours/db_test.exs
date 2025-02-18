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
      detour = build(:detour, status: nil)

      assert nil ==
               detour
               |> Detours.change_detour(%{})
               |> Ecto.Changeset.get_change(:status)

      assert :draft ==
               detour
               |> Detours.change_detour(%{state: with_id(detour.state, 100)})
               |> Ecto.Changeset.get_change(:status)

      assert :active ==
               detour
               |> Detours.change_detour(%{state: activated(detour.state)})
               |> Ecto.Changeset.get_change(:status)

      assert :past ==
               detour
               |> Detours.change_detour(%{state: deactivated(detour.state)})
               |> Ecto.Changeset.get_change(:status)
    end
  end
end
