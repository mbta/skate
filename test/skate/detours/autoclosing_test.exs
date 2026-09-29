defmodule Skate.Detours.Autoclosing.Test do
  alias Skate.Detours.Detours
  alias Skate.Detours.Db.Detour

  import Skate.Factory
  import Test.Support.AutoclosingHelpers

  use Skate.DataCase

  setup do
    with :ok <- setup_feature_flag(),
         :ok <- setup_test_group() do
      :ok
    else
      _ -> :error
    end
  end

  # Converts autoclose_on back to Eastern Time and asserts it's at end of service (03:00 ET next morning).
  defp assert_autoclose_on_end_of_service_et(autoclose_on) do
    autoclose_on_et = DateTime.shift_zone!(autoclose_on, "America/New_York")
    today_in_et = DateTime.to_date(DateTime.now!("America/New_York"))
    tomorrow_in_et = Date.add(today_in_et, 1)

    assert DateTime.to_date(autoclose_on_et) == tomorrow_in_et
    assert autoclose_on_et.hour == 3
    assert autoclose_on_et.minute == 0
    assert autoclose_on_et.second == 0
  end

  describe "Skate.Detours.Autoclosing.apply_status_filter/2" do
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

  describe "Skate.Detours.Db.Detour.changeset/2" do
    test "calculates autoclose_on as end of today (in ET) for '1 hour' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "1 hour")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_service_et(autoclose_on)
    end

    test "calculates autoclose_on as end of today (in ET) for '8 hours' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "8 hours")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_service_et(autoclose_on)
    end

    test "sets autoclose_on to nil for a duration range that doesn't match" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "not matching")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      refute Ecto.Changeset.get_change(changeset, :autoclose_on)
    end

    test "calculates autoclose_on as end of today (in ET) for 'Until further notice' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "Until further notice")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_service_et(autoclose_on)
    end

    test "calculates autoclose_on as end of today (in ET) for 'Until end of service' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "Until end of service")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_service_et(autoclose_on)
    end

    test "calculates autoclose_on for custom date string '2026-09-25' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "2026-09-25")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      autoclose_on_et = DateTime.shift_zone!(autoclose_on, "America/New_York")
      assert DateTime.to_date(autoclose_on_et) == ~D[2026-09-26]
      assert autoclose_on_et.hour == 3
      assert autoclose_on_et.minute == 0
      assert autoclose_on_et.second == 0
    end

    test "calculates autoclose_on as end of specified date for future dates" do
      future_date = "2026-12-31"

      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], future_date)

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      autoclose_on_et = DateTime.shift_zone!(autoclose_on, "America/New_York")
      assert DateTime.to_date(autoclose_on_et) == ~D[2027-01-01]
      assert autoclose_on_et.hour == 3
      assert autoclose_on_et.minute == 0
      assert autoclose_on_et.second == 0
    end

    test "sets autoclose_on to nil for nil estimated_duration in state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], nil)

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      refute Ecto.Changeset.get_change(changeset, :autoclose_on)
    end

    test "sets autoclose_on to nil for unrecognized duration string" do
      state =
        put_in(
          build(:detour_snapshot),
          ["context", "selectedDuration"],
          "Unknown Duration Format"
        )

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      refute Ecto.Changeset.get_change(changeset, :autoclose_on)
    end

    test "sets autoclose_on to nil for invalid date format" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "2026-13-45")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      refute Ecto.Changeset.get_change(changeset, :autoclose_on)
    end

    test "autoclose_on is end of day (03:00:00) when converted back to Eastern Time" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "1 hour")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_service_et(autoclose_on)
    end

    test "whitespace in estimated_duration is trimmed" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "  1 hour  ")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
    end

    test "creating a detour with estimated_duration from state sets autoclose_on" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "1 hour")

      detour = build(:detour)

      changeset = Detour.changeset(detour, %{"state" => state})

      # populate_fields_from_state will extract estimated_duration from state
      {:ok, saved_detour} = Skate.Repo.insert(changeset)

      assert saved_detour.estimated_duration == "1 hour"
      assert saved_detour.autoclose_on != nil
      assert_autoclose_on_end_of_service_et(saved_detour.autoclose_on)
    end

    test "updating an existing detour's estimated_duration updates autoclose_on" do
      {:ok, detour} = :detour |> build() |> Skate.Repo.insert()

      # Update with a new estimated_duration in state
      new_state =
        put_in(detour.state, ["context", "selectedDuration"], "Until further notice")

      changeset = Detour.changeset(detour, %{"state" => new_state})

      {:ok, updated_detour} = Skate.Repo.update(changeset)

      assert updated_detour.estimated_duration == "Until further notice"
      assert updated_detour.autoclose_on != nil
    end
  end
end
