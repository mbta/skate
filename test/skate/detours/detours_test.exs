defmodule Skate.Detours.DetoursTest do
  use Skate.DataCase
  import Skate.Factory
  import ExUnit.CaptureLog
  alias Skate.Detours.Detours

  defmodule MockedSwiftlyAdjustmentsModule do
    require Logger

    def get_adjustments_v1(_) do
      {:ok,
       %{
         adjustments: [
           %{id: 1, notes: "111", feedId: "skate.missing-env.service-adjustments"},
           %{id: 2, notes: "222", feedId: "skate.missing-env.service-adjustments"},
           %{id: 3, notes: nil, feedId: "skate.missing-env.service-adjustments"},
           %{id: 4, notes: "444", feedId: "skate.other-env.service-adjustments"}
         ]
       }}
    end

    def create_adjustment_v1(%{notes: detour_id}, _) do
      Logger.error("created_adjustment detour_id_#{detour_id}")
    end

    def delete_adjustment_v1(adjustment_id, _) do
      Logger.error("deleted_adjustment_id_#{adjustment_id}")
    end
  end

  describe "sync_swiftly_with_skate" do
    @tag :capture_log
    test "it creates adjustments in swiftly that are active in skate, but not present in swiftly" do
      :detour |> build() |> with_id(111) |> with_direction(:inbound) |> activated() |> insert()
      :detour |> build() |> with_id(222) |> with_direction(:inbound) |> activated() |> insert()
      :detour |> build() |> with_id(333) |> with_direction(:inbound) |> activated() |> insert()
      :detour |> build() |> with_id(444) |> deactivated() |> with_direction(:inbound) |> insert()

      log =
        capture_log(fn ->
          Detours.sync_swiftly_with_skate(MockedSwiftlyAdjustmentsModule, true)
        end)

      assert log =~
               "invalid_adjustment_note id=3 notes=nil"

      refute log =~ "invalid_adjustment_note id=4 notes=444"
      assert log =~ "created_adjustment detour_id_333"
    end

    @tag :capture_log
    test "it deletes adjustments in swiftly that are no longer active in skate, but are still present in swiftly" do
      :detour |> build() |> with_id(111) |> activated() |> with_direction(:inbound) |> insert()
      :detour |> build() |> with_id(444) |> deactivated() |> with_direction(:inbound) |> insert()

      log =
        capture_log(fn ->
          Detours.sync_swiftly_with_skate(MockedSwiftlyAdjustmentsModule, true)
        end)

      assert log =~
               "invalid_adjustment_note id=3 notes=nil"

      refute log =~ "invalid_adjustment_note id=4 notes=444"
      assert log =~ "deleted_adjustment_id_2"
    end
  end

  describe "get_swiftly_adjustment_for_detour" do
    @tag :capture_log
    test "fetches adjustment that corresponds to the given detour" do
      :detour |> build() |> with_id(111) |> with_direction(:inbound) |> activated() |> insert()

      %{id: 1, notes: "111", feedId: "skate.missing-env.service-adjustments"} =
        Detours.get_swiftly_adjustment_for_detour("111", MockedSwiftlyAdjustmentsModule)
    end
  end

  describe "delete_in_swiftly" do
    @tag :capture_log
    test "manually delete adjustment in swiftly for a given detour" do
      :detour |> build() |> with_id(111) |> with_direction(:inbound) |> activated() |> insert()

      log =
        capture_log(fn ->
          Detours.delete_in_swiftly("111", MockedSwiftlyAdjustmentsModule)
        end)

      assert log =~ "deleted_adjustment_id_1"
    end
  end

  describe "create_in_swiftly" do
    @tag :capture_log
    test "manually create adjustment in swiftly for active detour" do
      :detour |> build() |> with_id(000) |> with_direction(:inbound) |> activated() |> insert()

      log =
        capture_log(fn ->
          Detours.create_in_swiftly("000", MockedSwiftlyAdjustmentsModule)
        end)

      assert log =~ "created_adjustment detour_id_0"
    end
  end

  describe "copy_to_draft_detour/2" do
    test "successfully copies a past detour to draft" do
      detour =
        :detour
        |> build()
        |> deactivated()
        |> insert()

      author_id = detour.author_id

      {:ok, draft_detour} = Detours.copy_to_draft_detour(detour, author_id)

      assert draft_detour.status == :draft
      assert draft_detour.author_id == author_id
      assert draft_detour.state["context"]["uuid"] == draft_detour.id
      assert draft_detour.state["context"]["activatedAt"] == nil
      refute draft_detour.id == detour.id
    end

    test "fails to copy a detour that is not past" do
      detour =
        :detour
        |> build()
        |> activated()
        |> insert()

      author_id = detour.author_id

      assert {:error, :not_a_past_detour} = Detours.copy_to_draft_detour(detour, author_id)
    end

    test "successfully copies a past detour to draft with a different author" do
      original_author = insert(:user)
      new_author = insert(:user)

      detour =
        :detour
        |> build()
        |> with_author(original_author)
        |> deactivated()
        |> insert()

      {:ok, draft_detour} = Detours.copy_to_draft_detour(detour, new_author.id)

      assert draft_detour.status == :draft
      assert draft_detour.author_id == new_author.id
      assert draft_detour.state["context"]["uuid"] == draft_detour.id
      assert draft_detour.state["context"]["activatedAt"] == nil
      refute draft_detour.id == detour.id
    end
  end
end
