defmodule Realtime.TimePeriodTest do
  use ExUnit.Case
  alias Realtime.TimePeriod

  @time_periods TimePeriod.data()

  describe "current/1" do
    test "returns the time period for the given date and time" do
      monday_at_5_am = Timex.to_datetime({{2019, 7, 8}, {5, 00, 00}}, :local)
      tuesday_at_11_pm = Timex.to_datetime({{2019, 7, 9}, {23, 00, 00}}, :local)
      wednesday_at_1_am = Timex.to_datetime({{2019, 7, 10}, {1, 00, 00}}, :local)
      saturday_at_noon = Timex.to_datetime({{2019, 7, 6}, {12, 00, 00}}, :local)
      sunday_at_noon = Timex.to_datetime({{2019, 7, 7}, {12, 00, 00}}, :local)

      assert TimePeriod.current(monday_at_5_am) == {:ok, List.first(@time_periods)}
      assert TimePeriod.current(tuesday_at_11_pm) == {:ok, Enum.at(@time_periods, 7)}
      assert TimePeriod.current(wednesday_at_1_am) == {:ok, Enum.at(@time_periods, 8)}
      assert TimePeriod.current(saturday_at_noon) == {:ok, Enum.at(@time_periods, 9)}
      assert TimePeriod.current(sunday_at_noon) == {:ok, Enum.at(@time_periods, 10)}
    end
  end

  describe "current/0" do
    test "uses now" do
      refute TimePeriod.current() == :error
    end
  end

  describe "day_type/1" do
    test "returns day_type_03 for a Sunday" do
      sunday = Timex.to_datetime({{2019, 7, 7}, {12, 00, 00}}, :local)

      assert TimePeriod.day_type(sunday) == :day_type_03
    end

    test "returns day_type_02 for a Saturday" do
      saturday = Timex.to_datetime({{2019, 7, 6}, {12, 00, 00}}, :local)

      assert TimePeriod.day_type(saturday) == :day_type_02
    end

    test "returns day_type_01 for a Weekday" do
      monday = Timex.to_datetime({{2019, 7, 8}, {12, 00, 00}}, :local)
      tuesday = Timex.to_datetime({{2019, 7, 9}, {12, 00, 00}}, :local)

      assert TimePeriod.day_type(monday) == :day_type_01
      assert TimePeriod.day_type(tuesday) == :day_type_01
    end
  end

  describe "extended_day_seconds/1" do
    test "returns the number of seconds since midnight if it is 3am or later (the current service day is today)" do
      monday_at_3_am = Timex.to_datetime({{2019, 7, 8}, {3, 00, 00}}, :local)

      assert TimePeriod.extended_day_seconds(monday_at_3_am) == 10_800
    end

    test "returns the number of seconds since midnight yesterday if it is before 3am (the current service day is yesterday)" do
      tuesday_at_2_am = Timex.to_datetime({{2019, 7, 9}, {2, 00, 00}}, :local)

      assert TimePeriod.extended_day_seconds(tuesday_at_2_am) == 93_600
    end
  end

  describe "seconds_since_midnight/1" do
    test "returns the number of seconds since midnight" do
      three_am = Timex.to_datetime({{2019, 7, 8}, {3, 00, 00}}, :local)

      assert TimePeriod.seconds_since_midnight(three_am) == 10_800
    end
  end
end
