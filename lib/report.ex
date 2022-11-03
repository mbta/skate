defmodule Report do
  @doc """
  Exectutes a report against a given repo, returning the results or an error
  """
  @type t :: module()

  @report_modules [Report.UserSettings, Report.UserNamesAndUuids, Report.UserConfigurations]

  @callback run() :: {:ok, [map()]} | :error
  @callback short_name() :: String.t()
  @callback description() :: String.t()

  @spec to_csv(t()) :: {:ok, String.t()} | :error
  def to_csv(report) do
    case report.run() do
      {:ok, result} -> {:ok, result |> CSV.encode(headers: true) |> Enum.join()}
      :error -> :error
    end
  end

  @spec all_reports() :: %{String.t() => module()}
  def all_reports() do
    Map.new(@report_modules, fn report -> {report.short_name(), report} end)
  end
end
