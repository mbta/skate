defmodule Schedule.Gtfs.CalendarTest do
  use ExUnit.Case, async: true

  alias Schedule.Gtfs.Calendar

  describe "from_files" do
    test "only includes the given days of the week" do
      # 2019-07-01 is a Monday
      calendar_txt =
        Enum.join(
          [
            "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
            "weekdays,1,1,1,1,1,0,0,20190701,20190707",
            "weekends,0,0,0,0,0,1,1,20190701,20190707"
          ],
          "\n"
        )

      assert Calendar.from_files(calendar_txt, nil) == %{
               ~D[2019-07-01] => ["weekdays"],
               ~D[2019-07-02] => ["weekdays"],
               ~D[2019-07-03] => ["weekdays"],
               ~D[2019-07-04] => ["weekdays"],
               ~D[2019-07-05] => ["weekdays"],
               ~D[2019-07-06] => ["weekends"],
               ~D[2019-07-07] => ["weekends"]
             }
    end

    test "can add and remove dates" do
      calendar_txt =
        Enum.join(
          [
            "service_id,monday,tuesday,wednesday,thursday,friday,saturday,sunday,start_date,end_date",
            "service-with-removed-date,1,1,1,1,1,1,1,20190101,20190102",
            "service-with-added-date,1,1,1,1,1,1,1,20190103,20190103"
          ],
          "\n"
        )

      calendar_dates_txt =
        Enum.join(
          [
            "service_id,date,exception_type,holiday_name",
            # Remove 20190102 from service-with-removed-date ...
            "service-with-removed-date,20190102,2,",
            # ... and add it to service-with-added-date
            "service-with-added-date,20190102,1,"
          ],
          "\n"
        )

      assert Calendar.from_files(calendar_txt, calendar_dates_txt) == %{
               ~D[2019-01-01] => ["service-with-removed-date"],
               ~D[2019-01-02] => ["service-with-added-date"],
               ~D[2019-01-03] => ["service-with-added-date"]
             }
    end
  end
end
