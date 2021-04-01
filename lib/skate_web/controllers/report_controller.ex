defmodule SkateWeb.ReportController do
  @moduledoc """
  Provides a list of available reports with links to run each one
  individually and return a CSV.
  """

  use SkateWeb, :controller

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    reports =
      Report.all_reports()
      |> Enum.map(fn report -> {report.description(), report.short_name()} end)

    conn
    |> assign(:reports, reports)
    |> render("index.html", layout: {SkateWeb.LayoutView, "reports.html"})
  end

  @spec run(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def run(conn, params) do
    report = Enum.find(Report.all_reports(), &(&1.short_name() == params["short_name"]))

    if is_nil(report) do
      send_resp(conn, 404, "no report found")
    else
      {:ok, results} = Report.report_to_csv(report)

      send_download(conn, {:binary, results}, filename: report.short_name() <> ".csv")
    end
  end
end
