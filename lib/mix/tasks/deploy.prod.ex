defmodule Mix.Tasks.Deploy.Prod do
  @moduledoc """
  Open the Github Releases page that triggers a production deploy
  """
  use Mix.Task

  @shortdoc "Open the Github Releases page that allows us to trigger a production deploy"
  @spec run([binary]) :: any
  def run(_) do
    System.cmd("git", ["fetch"])

    latest_tag =
      System.cmd("git", ["describe", "origin/main", "--tags", "--abbrev=0"])
      |> case do
        {tag, 0} -> tag
      end
      |> String.trim()

    %{"previous_date" => previous_date, "previous_count" => previous_count} =
      Regex.named_captures(~r/(?<previous_date>.*)-(?<previous_count>\d)/, latest_tag)

    today = Date.to_string(Date.utc_today())

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

    System.cmd("open", [
      "https://github.com/mbta/skate/releases/new?tag=#{new_release}"
    ])
  end
end
