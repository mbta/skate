defmodule Report do
  @doc """
  Exectutes a report against a given repo, returning the results or an error
  """
  @type t :: module()

  @callback run() :: {:ok, [map()]} | :error
  @callback short_name() :: String.t()
  @callback description() :: String.t()

  @spec report_to_csv(t()) :: {:ok, String.t()} | :error
  def report_to_csv(report) do
    case report.run() do
      {:ok, result} -> {:ok, result |> CSV.encode(headers: true) |> Enum.join()}
      :error -> :error
    end
  end

  @spec all_reports() :: [module()]
  def all_reports, do: [Report.UserSettings]
end
