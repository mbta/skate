defmodule Skate.Detours.Db.DetourTest do
  use Skate.DataCase
  import Skate.Factory

  alias Skate.Detours.Db.Detour

  # Converts autoclose_on back to Eastern Time and asserts it's today at end of day.
  defp assert_autoclose_on_end_of_today_et(autoclose_on) do
    autoclose_on_et = DateTime.shift_zone!(autoclose_on, "America/New_York")
    today_in_et = DateTime.to_date(DateTime.now!("America/New_York"))

    assert DateTime.to_date(autoclose_on_et) == today_in_et
    assert autoclose_on_et.hour == 23
    assert autoclose_on_et.minute == 59
    assert autoclose_on_et.second == 59
  end

  describe "changeset - autoclose_on calculation" do
    test "calculates autoclose_on as end of today (in ET) for '1 hour' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "1 hour")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_today_et(autoclose_on)
    end

    test "calculates autoclose_on as end of today (in ET) for '8 hours' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "8 hours")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_today_et(autoclose_on)
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
      assert_autoclose_on_end_of_today_et(autoclose_on)
    end

    test "calculates autoclose_on as end of today (in ET) for 'Until end of service' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "Until end of service")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_today_et(autoclose_on)
    end

    test "calculates autoclose_on for custom date string '2026-09-25' from state" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "2026-09-25")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      autoclose_on_et = DateTime.shift_zone!(autoclose_on, "America/New_York")
      assert DateTime.to_date(autoclose_on_et) == ~D[2026-09-25]
      assert autoclose_on_et.hour == 23
      assert autoclose_on_et.minute == 59
      assert autoclose_on_et.second == 59
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
      assert DateTime.to_date(autoclose_on_et) == ~D[2026-12-31]
      assert autoclose_on_et.hour == 23
      assert autoclose_on_et.minute == 59
      assert autoclose_on_et.second == 59
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

    test "autoclose_on is end of day (23:59:59) when converted back to Eastern Time" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "1 hour")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      assert_autoclose_on_end_of_today_et(autoclose_on)
    end

    test "whitespace in estimated_duration is trimmed" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "  1 hour  ")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
    end
  end

  describe "changeset - integration with estimated_duration updates" do
    test "creating a detour with estimated_duration from state sets autoclose_on" do
      state =
        put_in(build(:detour_snapshot), ["context", "selectedDuration"], "1 hour")

      detour = build(:detour)

      changeset = Detour.changeset(detour, %{"state" => state})

      # populate_fields_from_state will extract estimated_duration from state
      {:ok, saved_detour} = Skate.Repo.insert(changeset)

      assert saved_detour.estimated_duration == "1 hour"
      assert saved_detour.autoclose_on != nil
      assert_autoclose_on_end_of_today_et(saved_detour.autoclose_on)
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
