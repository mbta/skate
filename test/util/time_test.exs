defmodule Util.TimeTest do
  use ExUnit.Case, async: true
  doctest Util.Time

  describe "end_of_service_in_utc/1" do
    test "end of service is next calendar day at 3am" do
      timezone = "America/New_York"

      today =
        timezone
        |> DateTime.now!()
        |> DateTime.to_date()

      tomorrow = Date.add(today, 1)

      end_of_service =
        today
        |> Util.Time.end_of_service_in_utc()
        |> DateTime.shift_zone!(timezone)

      assert DateTime.to_date(end_of_service) == tomorrow
      assert end_of_service.hour == 3
      assert end_of_service.minute == 0
      assert end_of_service.second == 0
    end
  end
end
