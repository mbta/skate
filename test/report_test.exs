defmodule ReportTest do
  use ExUnit.Case, async: true

  defmodule ReportTest.SuccessfulReport do
    @behaviour Report

    @impl Report
    def run() do
      {:ok, [%{"foo" => 1, "bar" => 2}, %{"foo" => 3, "bar" => 4}]}
    end

    @impl Report
    def short_name(), do: "success"

    @impl Report
    def description(), do: "Success"
  end

  defmodule ReportTest.FailedReport do
    @behaviour Report

    @impl Report
    def run(), do: :error

    @impl Report
    def short_name(), do: "failure"

    @impl Report
    def description(), do: "Failure"
  end

  describe "to_csv/1" do
    test "processes a succesful report" do
      {:ok, csv} = Report.to_csv(ReportTest.SuccessfulReport)

      decoded_csv =
        csv
        |> String.split("\r\n")
        |> Enum.filter(&(&1 != ""))
        |> CSV.decode(headers: true)
        |> Stream.map(fn {:ok, row} -> row end)
        |> Enum.to_list()

      assert decoded_csv == [%{"foo" => "1", "bar" => "2"}, %{"foo" => "3", "bar" => "4"}]
    end

    test "processes a failed report" do
      assert Report.to_csv(ReportTest.FailedReport) == :error
    end
  end

  describe "all_reports/0" do
    test "returns full list of reports" do
      assert Report.all_reports() == %{
               "user_settings" => Report.UserSettings,
               "user_names_and_uuids" => Report.UserNamesAndUuids
             }
    end
  end
end
