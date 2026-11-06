defmodule Skate.Detours.DbTest do
  use Skate.DataCase
  import Skate.Factory

  alias Skate.Detours.Detours

  describe "detours" do
    alias Skate.Detours.Db.Detour

    defp detour_fixture do
      insert(:detour)
    end

    defp assert_db_detour_row(detour, expected_id, expected_author_id) do
      assert %Detour{id: ^expected_id, author_id: ^expected_author_id} = detour
    end

    test "list_detours/0 returns all detours" do
      %{id: id} = detour_fixture()
      assert [%{id: ^id}] = Detours.list_detours()
    end

    test "list_detours/0 does not return state or coordinates fields" do
      detour_fixture()
      assert [detour] = Detours.list_detours()
      refute Map.has_key?(detour, :state)
      refute Map.has_key?(detour, :coordinates)
    end

    test "get_detour!/1 returns the detour with given id" do
      detour = detour_fixture()

      found =
        detour.id
        |> Detours.get_detour!()
        |> Skate.Repo.preload(:author)

      assert_db_detour_row(found, detour.id, detour.author_id)
    end

    test "get_detour_for_user!/2 returns the detour with the given detour id and author_id" do
      detour = detour_fixture()

      found =
        detour.id
        |> Detours.get_detour_for_user!(detour.author_id)
        |> Skate.Repo.preload(:author)

      assert_db_detour_row(found, detour.id, detour.author_id)

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

    test "change_detour/1 updates persisted status and activation fields" do
      {:ok, activated_detour} =
        build(:detour)
        |> Detours.change_detour(%{
          "status" => "active",
          "activated_at" => DateTime.utc_now(),
          "estimated_duration" => "1 hour"
        })
        |> Ecto.Changeset.apply_action(:update)

      assert %Detour{status: :active, estimated_duration: "1 hour"} = activated_detour

      {:ok, deactivated_detour} =
        activated_detour
        |> Detours.change_detour(%{"status" => "past", "estimated_duration" => nil})
        |> Ecto.Changeset.apply_action(:update)

      assert %Detour{status: :past, estimated_duration: nil} = deactivated_detour
    end
  end
end
