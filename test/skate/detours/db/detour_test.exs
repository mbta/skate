defmodule Skate.Detours.Db.DetourTest do
  use Skate.DataCase
  import Skate.Factory

  alias Skate.Detours.Db.Detour

  describe "changeset - autoclose_on calculation" do
    test "calculates autoclose_on as end of today for '1 - 8 hrs' from state" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "1 - 8 hrs")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      # 23:59:59 ET today converts to early morning UTC tomorrow
      expected_date = Date.add(Date.utc_today(), 1)
      assert DateTime.to_date(autoclose_on) == expected_date
    end

    test "calculates autoclose_on as end of today for 'Until Further Notice' from state" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "Until Further Notice")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      expected_date = Date.add(Date.utc_today(), 1)
      assert DateTime.to_date(autoclose_on) == expected_date
    end

    test "calculates autoclose_on as end of today for 'End of Service' from state" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "End of Service")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      expected_date = Date.add(Date.utc_today(), 1)
      assert DateTime.to_date(autoclose_on) == expected_date
    end

    test "calculates autoclose_on for custom date string '2026-09-25' from state" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "2026-09-25")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      # 23:59:59 ET on 2026-09-25 converts to early morning UTC 2026-09-26
      assert DateTime.to_date(autoclose_on) == ~D[2026-09-26]
    end

    test "calculates autoclose_on as end of specified date for future dates" do
      future_date = "2026-12-31"

      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], future_date)

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      # 23:59:59 ET on 2026-12-31 converts to early morning UTC 2027-01-01
      assert DateTime.to_date(autoclose_on) == ~D[2027-01-01]
    end

    test "sets autoclose_on to nil for nil estimated_duration in state" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], nil)

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      refute Ecto.Changeset.get_change(changeset, :autoclose_on)
    end

    test "sets autoclose_on to nil for unrecognized duration string" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "Unknown Duration Format")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      refute Ecto.Changeset.get_change(changeset, :autoclose_on)
    end

    test "sets autoclose_on to nil for invalid date format" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "2026-13-45")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      refute Ecto.Changeset.get_change(changeset, :autoclose_on)
    end

    test "autoclose_on is stored as UTC time (23:59:59 ET = early next morning UTC)" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "1 - 8 hrs")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
      # 23:59:59.999999 ET converts to early morning UTC (3-5 AM depending on DST)
      # In September 2026, EDT (UTC-4) is in effect, so it should be ~3:59:59 UTC
      time = DateTime.to_time(autoclose_on)
      # Could vary with DST
      assert time.hour in [3, 4, 5]
      assert time.minute == 59
      assert time.second == 59
    end

    test "whitespace in estimated_duration is trimmed" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "  1 - 8 hrs  ")

      detour = build(:detour)
      changeset = Detour.changeset(detour, %{"state" => state})

      assert autoclose_on = Ecto.Changeset.get_change(changeset, :autoclose_on)
      assert autoclose_on != nil
    end
  end

  describe "changeset - integration with estimated_duration updates" do
    test "creating a detour with estimated_duration from state sets autoclose_on" do
      state =
        build(:detour_snapshot)
        |> put_in(["context", "selectedDuration"], "1 - 8 hrs")

      detour = build(:detour)

      changeset = Detour.changeset(detour, %{"state" => state})

      # populate_fields_from_state will extract estimated_duration from state
      {:ok, saved_detour} = Skate.Repo.insert(changeset)

      assert saved_detour.estimated_duration == "1 - 8 hrs"
      assert saved_detour.autoclose_on != nil
      # 23:59:59 ET today converts to early morning UTC tomorrow
      expected_date = Date.add(Date.utc_today(), 1)
      assert DateTime.to_date(saved_detour.autoclose_on) == expected_date
    end

    test "updating an existing detour's estimated_duration updates autoclose_on" do
      {:ok, detour} = :detour |> build() |> Skate.Repo.insert()

      # Update with a new estimated_duration in state
      new_state =
        detour.state
        |> put_in(["context", "selectedDuration"], "Until Further Notice")

      changeset = Detour.changeset(detour, %{"state" => new_state})

      {:ok, updated_detour} = Skate.Repo.update(changeset)

      assert updated_detour.estimated_duration == "Until Further Notice"
      assert updated_detour.autoclose_on != nil
    end
  end
end
