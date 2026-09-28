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
      assert draft_detour.state["context"]["uuid"] == draft_detour.id
      assert draft_detour.state["context"]["activatedAt"] == nil
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
      %{id: id, author_id: author_id, state: snapshot} =
        :detour
        |> build()
        |> activated()
        |> insert()
        |> deactivated()

      log =
        capture_log(fn ->
          Skate.Detours.Detours.upsert_from_snapshot(author_id, with_id(snapshot, id))
        end)

      assert log =~ "deactivate_detour id=#{id}"
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

  describe "autoclosing" do
    setup do
      with :ok <- setup_feature_flag(),
           :ok <- setup_test_group() do
        :ok
      else
        _ -> :error
      end
    end

    defp setup_test_group() do
      test_group_name = Skate.Detours.Autoclosing.test_group_name()

      with {:ok, test_group} <- Skate.Settings.TestGroup.create(test_group_name),
           %Skate.Settings.TestGroup{override: :enabled} <-
             Skate.Settings.TestGroup.update(%{
               test_group
               | override: :enabled
             }) do
        :ok
      else
        _ -> :error
      end
    end

    defp setup_feature_flag() do
      feature_flag_name = Skate.Detours.Autoclosing.feature_flag_name()

      reassign_env(:skate, feature_flag_name, "on")

      :ok
    end

    test "filters :active status correctly - includes detours with activated_at and no autoclose_on" do
      now = DateTime.utc_now()
      past_activated = DateTime.add(now, -1, :hour)

      :detour
      |> build()
      |> with_id(1)
      |> activated(past_activated)
      |> with_autoclose_on(nil)
      |> insert()

      # Should be included in active filter
      detours = Detours.detours_for_route("all", :active)
      assert Enum.any?(detours, &(&1.id == 1))
    end

    test "filters :active status correctly - includes detours with activated_at and autoclose_on in future" do
      now = DateTime.utc_now()
      past_activated = DateTime.add(now, -1, :hour)
      future_autoclose = DateTime.add(now, 2, :hour)

      :detour
      |> build()
      |> with_id(2)
      |> activated(past_activated)
      |> with_autoclose_on(future_autoclose)
      |> insert()

      # Should be included in active filter
      detours = Detours.detours_for_route("all", :active)
      assert Enum.any?(detours, &(&1.id == 2))
    end

    test "filters :active status correctly - excludes detours with autoclose_on in past" do
      now = DateTime.utc_now()
      past_activated = DateTime.add(now, -2, :hour)
      past_autoclose = DateTime.add(now, -1, :hour)

      :detour
      |> build()
      |> with_id(3)
      |> activated(past_activated)
      |> with_autoclose_on(past_autoclose)
      |> insert()

      # Should NOT be included in active filter
      detours = Detours.detours_for_route("all", :active)
      refute Enum.any?(detours, &(&1.id == 3))
    end

    test "filters :active status correctly - excludes detours without activated_at" do
      :detour
      |> build()
      |> with_id(4)
      |> insert()

      # Should NOT be included in active filter (not activated)
      detours = Detours.detours_for_route("all", :active)
      refute Enum.any?(detours, &(&1.id == 4))
    end

    test "filters :active status correctly - excludes manually deactivated detours" do
      now = DateTime.utc_now()
      past_activated = DateTime.add(now, -1, :hour)
      future_autoclose = DateTime.add(now, 2, :hour)

      :detour
      |> build()
      |> with_id(20)
      |> activated(past_activated)
      |> with_autoclose_on(future_autoclose)
      |> deactivated()
      |> insert()

      :detour
      |> build()
      |> with_id(21)
      |> activated(past_activated)
      |> with_autoclose_on(nil)
      |> deactivated()
      |> insert()

      active_detours = Detours.detours_for_route("all", :active)
      refute Enum.any?(active_detours, &(&1.id in [20, 21]))

      past_detours = Detours.detours_for_route("all", :past)
      assert Enum.all?([20, 21], fn id -> Enum.any?(past_detours, &(&1.id == id)) end)
    end

    test "filters :draft status correctly - includes only detours without activated_at" do
      author = insert(:user)

      :detour
      |> build(author: author)
      |> with_id(5)
      |> insert()

      # Should be included in draft filter
      detours = Detours.detours_for_user(author.id, :draft)
      assert Enum.any?(detours, &(&1.id == 5))
    end

    test "filters :draft status correctly - excludes activated detours" do
      author = insert(:user)
      now = DateTime.utc_now()

      :detour
      |> build(author: author)
      |> with_id(6)
      |> activated(DateTime.add(now, -1, :hour))
      |> insert()

      # Should NOT be included in draft filter
      detours = Detours.detours_for_user(author.id, :draft)
      refute Enum.any?(detours, &(&1.id == 6))
    end

    test "filters :past status correctly - includes detours with autoclose_on in past" do
      now = DateTime.utc_now()
      past_activated = DateTime.add(now, -2, :hour)
      past_autoclose = DateTime.add(now, -1, :hour)

      :detour
      |> build()
      |> with_id(7)
      |> activated(past_activated)
      |> with_autoclose_on(past_autoclose)
      |> insert()

      # Should be included in past filter
      detours = Detours.detours_for_route("all", :past)
      assert Enum.any?(detours, &(&1.id == 7))
    end

    test "filters :past status correctly - excludes detours with autoclose_on in future" do
      now = DateTime.utc_now()
      past_activated = DateTime.add(now, -1, :hour)
      future_autoclose = DateTime.add(now, 2, :hour)

      :detour
      |> build()
      |> with_id(8)
      |> activated(past_activated)
      |> with_autoclose_on(future_autoclose)
      |> insert()

      # Should NOT be included in past filter
      detours = Detours.detours_for_route("all", :past)
      refute Enum.any?(detours, &(&1.id == 8))
    end

    test "filters :past status correctly - excludes detours without autoclose_on" do
      now = DateTime.utc_now()
      past_activated = DateTime.add(now, -1, :hour)

      :detour
      |> build()
      |> with_id(9)
      |> activated(past_activated)
      |> insert()

      # Should NOT be included in past filter (no autoclose_on set)
      detours = Detours.detours_for_route("all", :past)
      refute Enum.any?(detours, &(&1.id == 9))
    end

    test "count_detours_for_route works with experimental filter for :active status" do
      now = DateTime.utc_now()

      :detour
      |> build()
      |> with_id(10)
      |> activated(DateTime.add(now, -1, :hour))
      |> with_autoclose_on(nil)
      |> insert()

      :detour
      |> build()
      |> with_id(11)
      |> activated(DateTime.add(now, -1, :hour))
      |> with_autoclose_on(DateTime.add(now, -1, :hour))
      |> insert()

      count = Detours.count_detours_for_route("all", :active)
      assert count >= 1
      assert Enum.any?(Detours.detours_for_route("all", :active), &(&1.id == 10))
    end

    test "count_detours_for_user works with experimental filter for :draft status" do
      author = insert(:user)

      :detour
      |> build(author: author)
      |> with_id(12)
      |> insert()

      count = Detours.count_detours_for_user(author.id, :draft)
      assert count >= 1
    end
  end
end
