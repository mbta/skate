defmodule Util.TimeTest do
  use ExUnit.Case, async: true
  doctest Util.Time
  @timezone "America/New_York"
  @fixed_date ~D[2026-10-15]
  @fixed_eos DateTime.new!(@fixed_date, ~T[03:00:00], @timezone)

  describe "end_of_service/0" do
    test "matches end_of_service/1 for current time in Eastern Time" do
      now = DateTime.now!(@timezone)
      assert Util.Time.end_of_service() == Util.Time.end_of_service(now)
    end
  end

  describe "end_of_service/1" do
    test "uses the next day if the given DateTime is before midnight before the end of the service day" do
      dt = DateTime.new!(@fixed_date, ~T[23:00:00], @timezone)
      eos = Date.add(@fixed_eos, 1)

      assert Util.Time.end_of_service(dt) == eos
    end

    test "uses the same day if the given DateTime is after midnight before the end of the service day" do
      dt = DateTime.new!(@fixed_date, ~T[02:00:00], @timezone)
      eos = @fixed_eos

      assert Util.Time.end_of_service(dt) == eos
    end

    test "UTC inputs are not assumed to be eastern time" do
      # 01:30 AM EDT on Oct 15 is 05:30 AM UTC on Oct 15
      dt = DateTime.new!(@fixed_date, ~T[05:30:00], "Etc/UTC")
      eos = @fixed_eos

      assert Util.Time.end_of_service(dt) == eos
    end

    test "correctly handles UTC datetimes where UTC date differs from Eastern date" do
      # 11:30 PM EDT on Oct 14 is 03:30 AM UTC on Oct 15
      dt = DateTime.new!(@fixed_date, ~T[03:30:00], "Etc/UTC")
      eos = @fixed_eos

      assert Util.Time.end_of_service(dt) == eos
    end

    test "uses daylight saving time for the spring transition" do
      assert Util.Time.end_of_service(~D[2026-03-07]) ==
               DateTime.new!(~D[2026-03-08], ~T[03:00:00], @timezone)
    end

    test "uses standard time for the fall transition" do
      assert Util.Time.end_of_service(~D[2026-10-31]) ==
               DateTime.new!(~D[2026-11-01], ~T[03:00:00], @timezone)
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
