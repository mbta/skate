defmodule Skate.Detours.DbTest do
  use Skate.DataCase
  import Skate.Factory

  alias Skate.Detours.Db

  describe "detours" do
    alias Skate.Detours.Db.Detour

    @invalid_attrs %{state: nil}

    defp detour_fixture do
      insert(:detour)
    end

    test "list_detours/0 returns all detours" do
      detour = detour_fixture()
      assert Skate.Repo.preload(Db.list_detours(), :author) == [detour]
    end

    test "get_detour!/1 returns the detour with given id" do
      detour = detour_fixture()

      assert detour.id
             |> Db.get_detour!()
             |> Skate.Repo.preload(:author) == detour
    end

    test "create_detour/1 with valid data creates a detour" do
      valid_attrs = %{state: %{}}

      assert {:ok, %Detour{} = detour} = Db.create_detour(valid_attrs)
      assert detour.state == %{}
    end

    test "create_detour/1 with invalid data returns error changeset" do
      assert {:error, %Ecto.Changeset{}} = Db.create_detour(@invalid_attrs)
    end

    test "update_detour/2 with valid data updates the detour" do
      detour = detour_fixture()
      update_attrs = %{state: %{}}

      assert {:ok, %Detour{} = detour} = Db.update_detour(detour, update_attrs)
      assert detour.state == %{}
    end

    test "update_detour/2 with invalid data returns error changeset" do
      detour = detour_fixture()
      assert {:error, %Ecto.Changeset{}} = Db.update_detour(detour, @invalid_attrs)

      assert detour ==
               detour.id
               |> Db.get_detour!()
               |> Skate.Repo.preload(:author)
    end

    test "delete_detour/1 deletes the detour" do
      detour = detour_fixture()
      assert {:ok, %Detour{}} = Db.delete_detour(detour)
      assert_raise Ecto.NoResultsError, fn -> Db.get_detour!(detour.id) end
    end

    test "change_detour/1 returns a detour changeset" do
      detour = detour_fixture()
      assert %Ecto.Changeset{} = Db.change_detour(detour)
    end
  end
end
