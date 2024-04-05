defmodule Mix.Tasks.Deploy.Prod do
  @moduledoc """
  Deploy Skate to production
  """
  use Mix.Task

  @shortdoc "Deploy Skate to production"
  @spec run([binary]) :: any
  def run(_) do
    IO.puts("Running the task!")

    latest_tag =
      System.cmd("git", ["describe", "--tags", "--abbrev=0"])
      |> case do
        {tag, 0} -> tag
      end
      |> String.trim()

    IO.inspect(latest_tag, label: "Latest Release")

    %{"previous_date" => previous_date, "previous_count" => previous_count} =
      Regex.named_captures(~r/(?<previous_date>.*)-(?<previous_count>\d)/, latest_tag)

    IO.inspect(previous_date, label: "Previous Date")
    IO.inspect(previous_count, label: "Previous Count")

    today = Date.to_string(Date.utc_today())
    IO.inspect(today)

    count =
      1 +
        case today do
          ^previous_date ->
            previous_count
            |> Integer.parse()
            |> case do
              {previous_count, ""} ->
                previous_count
            end

          _ ->
            0
        end

    new_release = "#{today}-#{count}"

    IO.inspect(new_release, label: "New Release")
  end
end
