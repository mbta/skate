defmodule Skate.Detours.DetoursTest do
  use Skate.DataCase
  import Skate.Factory
  import ExUnit.CaptureLog
  import Test.Support.Helpers
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

  defmodule LifecycleAdjustments do
    def create_adjustment_v1(request, opts) do
      record_call({:create, request, opts})
    end

    def delete_adjustment_v1(id, opts) do
      record_call({:delete, id, opts})
    end

    defp record_call(call) do
      detour = Skate.Repo.get!(Skate.Detours.Db.Detour, Process.get(:lifecycle_detour_id))
      send(self(), {:adjustment_call, call, detour.status, detour.swiftly_id})
      [result | remaining] = Process.get(:adjustment_results)
      Process.put(:adjustment_results, remaining)
      result
    end
  end

  describe "lifecycle Swiftly adjustments" do
    setup do
      reassign_env(:skate, :s3_bucket, nil)
      reassign_env(:skate, :swiftly, adjustments_module: LifecycleAdjustments)
      {:ok, group} = Skate.Settings.TestGroup.create("send-detours-to-swiftly-enabled")
      group = Skate.Settings.TestGroup.update(%{group | override: :enabled})
      %{group: group}
    end

    test "activation retries before persistence and stores the adjustment id" do
      detour = insert(:detour)
      Process.put(:lifecycle_detour_id, detour.id)

      Process.put(:adjustment_results, [
        {:error, :unavailable},
        {:ok, %{adjustmentId: "new-id"}}
      ])

      assert {:ok, activated} =
               Detours.activate_detour(detour.id, detour.author_id, "1 hour", "Construction")

      assert activated.swiftly_id == "new-id"
      assert_receive {:adjustment_call, {:create, request, opts}, :draft, nil}
      assert request.notes == to_string(detour.id)
      refute Keyword.has_key?(opts, :adjustment_id)
      assert_receive {:adjustment_call, {:create, ^request, ^opts}, :draft, nil}
      refute_receive {:adjustment_call, _, _, _}
    end

    test "disabled integration and text-only activation do not call Swiftly", %{group: group} do
      Skate.Settings.TestGroup.update(%{group | override: :disabled})
      detour = insert(:detour)

      assert {:ok, %{status: :active}} =
               Detours.activate_detour(detour.id, detour.author_id, "1 hour", "Construction")

      Skate.Settings.TestGroup.update(%{group | override: :enabled})
      text_detour = insert(:detour, is_text_only: true)

      assert {:ok, %{status: :active}} =
               Detours.activate_detour(
                 text_detour.id,
                 text_detour.author_id,
                 "1 hour",
                 "Construction"
               )

      refute_receive {:adjustment_call, _, _, _}
    end

    test "text-only transitions take precedence over geometry updates" do
      detour = :detour |> build(is_text_only: true) |> activated() |> insert()
      Process.put(:lifecycle_detour_id, detour.id)
      Process.put(:adjustment_results, [{:ok, %{adjustmentId: "new-id"}}, {:ok, nil}])

      snapshot =
        detour
        |> Skate.Detours.SnapshotSerde.serialize()
        |> put_in(["context", "isTextOnly"], false)
        |> put_in(["context", "startPoint"], %{"lat" => 1, "lon" => 2})

      assert {:ok, drawn} = Detours.upsert_from_snapshot(detour.author_id, snapshot)
      assert drawn.swiftly_id == "new-id"
      assert_receive {:adjustment_call, {:create, _, opts}, :active, nil}
      refute Keyword.has_key?(opts, :adjustment_id)

      snapshot =
        drawn
        |> Skate.Detours.SnapshotSerde.serialize()
        |> put_in(["context", "isTextOnly"], true)
        |> put_in(["context", "startPoint"], %{"lat" => 3, "lon" => 4})

      assert {:ok, text} = Detours.upsert_from_snapshot(detour.author_id, snapshot)
      assert is_nil(text.swiftly_id)
      assert_receive {:adjustment_call, {:delete, "new-id", _}, :active, "new-id"}
      refute_receive {:adjustment_call, _, _, _}
    end

    test "geometry update uses existing id; failed deactivation retries and still persists" do
      detour =
        :detour
        |> build(swiftly_id: "existing")
        |> activated()
        |> with_updated_at(NaiveDateTime.add(NaiveDateTime.utc_now(), -120))
        |> insert()

      Process.put(:lifecycle_detour_id, detour.id)

      Process.put(:adjustment_results, [
        {:ok, %{adjustmentId: "existing"}},
        {:error, :unavailable},
        {:error, :unavailable}
      ])

      snapshot =
        detour
        |> Skate.Detours.SnapshotSerde.serialize()
        |> put_in(["context", "startPoint"], %{"lat" => 1, "lon" => 2})

      assert {:ok, updated} = Detours.upsert_from_snapshot(detour.author_id, snapshot)
      assert_receive {:adjustment_call, {:create, _, opts}, :active, "existing"}
      assert opts[:adjustment_id] == "existing"

      assert {:ok, nil} = Detours.autoclose_detour(updated)
      assert_receive {:adjustment_call, {:delete, "existing", _}, :active, "existing"}
      assert_receive {:adjustment_call, {:delete, "existing", _}, :active, "existing"}

      assert %{status: :past, swiftly_id: "existing"} =
               Repo.get!(Skate.Detours.Db.Detour, detour.id)
    end

    test "geometry update without an id does not create an adjustment" do
      detour =
        :detour
        |> build()
        |> activated()
        |> with_updated_at(NaiveDateTime.add(NaiveDateTime.utc_now(), -120))
        |> insert()

      snapshot =
        detour
        |> Skate.Detours.SnapshotSerde.serialize()
        |> put_in(["context", "startPoint"], %{"lat" => 1, "lon" => 2})

      assert {:ok, %{swiftly_id: nil}} =
               Detours.upsert_from_snapshot(detour.author_id, snapshot)

      assert {:error, :not_found} =
               Skate.Detours.SwiftlyAdjustments.execute(
                 {:update, detour, nil},
                 LifecycleAdjustments,
                 []
               )

      refute_receive {:adjustment_call, _, _, _}
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
      assert draft_detour.activated_at == nil
      refute draft_detour.id == detour.id
      assert draft_detour.copied_from_id == detour.id
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
        |> activated()
        |> deactivated()
        |> insert()

      {:ok, draft_detour} = Detours.copy_to_draft_detour(detour, new_author.id)

      assert draft_detour.status == :draft
      assert draft_detour.author_id == new_author.id
      assert draft_detour.activated_at == nil
      refute draft_detour.id == detour.id
      assert draft_detour.copied_from_id == detour.id
      assert draft_detour.estimated_duration == nil
      assert draft_detour.reason == nil
    end
  end

  describe "detour lifecycle logging" do
    setup do
      set_log_level(:info)
      reassign_env(:skate, :s3_bucket, nil)
      :ok
    end

    test "logs metadata when activating a detour" do
      %{id: id, author_id: author_id} =
        :detour
        |> build()
        |> insert()

      log =
        capture_log(fn ->
          Detours.activate_detour(id, author_id, "1 hour", "Construction")
        end)

      assert log =~ "activate_detour id=#{id}"
    end

    test "logs metadata when deactivating a detour" do
      detour =
        :detour
        |> build()
        |> activated()
        |> insert()
        |> deactivated()

      snapshot =
        Skate.Detours.SnapshotSerde.serialize(detour)

      log =
        capture_log(fn ->
          Skate.Detours.Detours.upsert_from_snapshot(detour.author_id, snapshot)
        end)

      assert log =~ "deactivate_detour id=#{detour.id}"
    end
  end

  describe "detour list filtering" do
    test "filters past detours by route, intersection, reason, and updated_at dates" do
      :detour
      |> build(reason: "Construction")
      |> deactivated()
      |> with_id(101)
      |> with_route(%{name: "66", id: "66"})
      |> with_nearest_intersection("Main St & 1st Ave")
      |> with_updated_at(~U[2026-08-01 14:00:00Z])
      |> insert()

      :detour
      |> build(reason: "Parade")
      |> deactivated()
      |> with_id(102)
      |> with_route(%{name: "66", id: "66"})
      |> with_nearest_intersection("Broadway & 2nd Ave")
      |> with_updated_at(~U[2026-08-03 14:00:00Z])
      |> insert()

      :detour
      |> build(reason: "Construction")
      |> deactivated()
      |> with_id(103)
      |> with_route(%{name: "66", id: "66"})
      |> with_nearest_intersection("Main St & 3rd Ave")
      |> with_updated_at(~U[2026-08-05 14:00:00Z])
      |> insert()

      :detour
      |> build(reason: "Construction")
      |> activated()
      |> with_id(104)
      |> with_route(%{name: "66", id: "66"})
      |> with_nearest_intersection("Main St & 4th Ave")
      |> with_updated_at(~U[2026-08-01 14:00:00Z])
      |> insert()

      filters = %{
        intersection: "Main",
        reason: "Construction",
        updated_at: [~D[2026-08-01], ~D[2026-08-03]]
      }

      detours = Detours.detours_for_route("66", :past, nil, nil, filters)

      assert Enum.map(detours, & &1.id) == [101]
      assert Detours.count_detours_for_route("66", :past, filters) == 1
    end

    test "filters draft detours by user and intersection" do
      author = insert(:user)
      other_author = insert(:user)

      :detour
      |> build(author: author)
      |> with_id(201)
      |> with_nearest_intersection("Main St & 1st Ave")
      |> with_updated_at(~U[2026-08-01 12:00:00Z])
      |> insert()

      :detour
      |> build(author: author)
      |> with_id(202)
      |> with_nearest_intersection("Broadway & 2nd Ave")
      |> with_updated_at(~U[2026-08-01 12:01:00Z])
      |> insert()

      :detour
      |> build(author: other_author)
      |> with_id(203)
      |> with_nearest_intersection("Main St & 3rd Ave")
      |> with_updated_at(~U[2026-08-01 12:02:00Z])
      |> insert()

      filters = %{intersection: "Main"}

      detours = Detours.detours_for_user(author.id, :draft, nil, nil, filters)

      assert Enum.map(detours, & &1.id) == [201]
      assert Detours.count_detours_for_user(author.id, :draft, filters) == 1
    end
  end

  describe "calculate_expiration_timestamp" do
    @activated_at ~U[2026-01-05 15:00:00.000000Z]

    test "calculates expiration from hour duration" do
      detour =
        :detour
        |> build()
        |> activated(@activated_at, "2 hours")

      assert DateTime.compare(
               Detours.calculate_expiration_timestamp(detour, "2 hours"),
               DateTime.add(@activated_at, 2, :hour)
             ) == :eq
    end

    test "calculates expiration from date" do
      detour =
        :detour
        |> build()
        |> activated(@activated_at, "2026-01-10")

      assert DateTime.compare(
               Detours.calculate_expiration_timestamp(detour, "2026-01-10"),
               DateTime.new!(~D[2026-01-11], ~T[03:00:00], "America/New_York")
             ) == :eq
    end

    test "calculates expiration from end of service" do
      detour =
        :detour
        |> build()
        |> activated(@activated_at, "Until end of service")

      assert DateTime.compare(
               Detours.calculate_expiration_timestamp(detour, "Until end of service"),
               DateTime.new!(~D[2026-01-06], ~T[03:00:00], "America/New_York")
             ) == :eq
    end

    test "does not return expiration when unknown" do
      detour =
        :detour
        |> build()
        |> activated(@activated_at, "Until further notice")

      assert Detours.calculate_expiration_timestamp(detour, "Until further notice") == nil
    end
  end
end
