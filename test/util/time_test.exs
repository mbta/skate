defmodule Util.TimeTest do
  use ExUnit.Case, async: true
  doctest Util.Time

  describe "end_of_service/0" do
    test "end of service is next day at 3am" do
      today = Util.Time.today()
      tomorrow = Date.add(today, 1)
      end_of_service = Util.Time.end_of_service()

      assert DateTime.to_date(end_of_service) == tomorrow
      assert end_of_service.hour == 3
      assert end_of_service.minute == 0
      assert end_of_service.second == 0
    end
  end

  describe "end_of_service/1" do
    test "uses the next day if the given DateTime is before midnight before the end of the service day" do
      dt = DateTime.new!(~D[2025-12-31], ~T[23:00:00], "America/New_York")
      eos = DateTime.new!(~D[2026-01-01], ~T[03:00:00], "America/New_York")

      assert Util.Time.end_of_service(dt) == eos
    end

    test "uses the same day if the given DateTime is after midnight before the end of the service day" do
      dt = DateTime.new!(~D[2026-01-01], ~T[02:00:00], "America/New_York")
      eos = DateTime.new!(~D[2026-01-01], ~T[03:00:00], "America/New_York")

      assert Util.Time.end_of_service(dt) == eos
    end

    test "uses daylight saving time for the spring transition" do
      assert Util.Time.end_of_service(~D[2026-03-07]) ==
               DateTime.new!(~D[2026-03-08], ~T[03:00:00], "America/New_York")
    end

    test "uses standard time for the fall transition" do
      assert Util.Time.end_of_service(~D[2026-10-31]) ==
               DateTime.new!(~D[2026-11-01], ~T[03:00:00], "America/New_York")
    end
  end

  describe "end_of_service_in_utc/1" do
    test "uses daylight saving time for the spring transition" do
      assert Util.Time.end_of_service_in_utc(~D[2026-03-07]) == ~U[2026-03-08 07:00:00.000000Z]
    end

    test "uses standard time for the fall transition" do
      assert Util.Time.end_of_service_in_utc(~D[2026-10-31]) == ~U[2026-11-01 08:00:00.000000Z]
    end
  end
end
