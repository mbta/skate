#/usr/bin/env elixir

# run with mix run hastus_export_bugfix_winter_25.ex --no-mix-exs

# TL;DR: This script was needed to fix an issue with the HASTUS export for Winter 2025.
# The Transit Data export was run before the Skate export, and the trip_ids for `td_lynn_ns_trips`
# were edited in-between. So this script used the all_trips.txt file generated by TD
# to update the trip ids of Skate's trips.csv and output a new_trips.csv file.

# Extra info: https://www.notion.so/mbta-downtown-crossing/Proposal-to-reorganize-quarterly-HASTUS-exports-for-Transit-Tech-teams-184f5d8d11ea80acb242fb8a524c5093?pvs=4#185f5d8d11ea8072a4ebd9547c2d40af

Mix.install([:csv])

skate_lynn_ns_trips = "./trips.csv"
|> Path.expand(__DIR__)
|> File.stream!
|> CSV.decode!(separator: ?;, headers: true, field_transform: &String.trim/1)

td_lynn_ns_trips = "./all_trips.txt"
|> Path.expand(__DIR__)
|> File.stream!
|> CSV.decode!(headers: true, field_transform: &String.trim/1)
|> Enum.filter(fn td_trip -> td_trip["schedule_name"] == "abl15ns1" end)

trips_with_updated_ids = Enum.map(skate_lynn_ns_trips, fn skate_trip ->

  if skate_trip["schedule_id"] != "abl15ns1" do
    skate_trip
  else
    # This confirmed that for each trip in Skate, there was one trip in the td file that matched
    # Enum.count(td_lynn_ns_trips,
    #   fn td_trip -> td_trip["block_id"] == skate_trip["block_id"] and
    #                 td_trip["trip_time_start"] == skate_trip["start_time"] <> ":00" and
    #                 td_trip["trip_time_end"] == skate_trip["end_time"] <> ":00" and
    #                 td_trip["trip_place_start"] == skate_trip["start_place"] and
    #                 td_trip["trip_place_end"] == skate_trip["end_place"]
    #   end)

    td_lynn_ns_trip_id = Enum.find(td_lynn_ns_trips,
      fn td_trip -> td_trip["block_id"] == skate_trip["block_id"] and
                    td_trip["trip_time_start"] == skate_trip["start_time"] <> ":00" and
                    td_trip["trip_time_end"] == skate_trip["end_time"] <> ":00" and
                    td_trip["trip_place_start"] == skate_trip["start_place"] and
                    td_trip["trip_place_end"] == skate_trip["end_place"]
      end
    )["trip_id"]
    |> String.split("-")
    |> List.first()

    # This confirmed that 100% of the trips were mismatched between TD and Skate. That is: 1189 Lynn No-School trips were mismatched
    # if td_lynn_ns_trip_id != skate_trip["trip_id"] do
    #   IO.inspect(skate_trip["trip_id"], label: "skate")
    # end

    Map.replace(skate_trip, "trip_id", td_lynn_ns_trip_id)
  end
end)

new_file = File.stream!("new_trips.csv")

CSV.encode(trips_with_updated_ids, separator: ?;, delimiter: "\n", headers: ["schedule_id", "area", "run_id", "block_id", "start_time", "end_time", "start_place", "end_place", "route_id", "trip_id"])
|> Enum.to_list()
|> Enum.into(new_file)
