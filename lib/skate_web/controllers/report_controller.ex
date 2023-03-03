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
      |> Enum.map(fn {short_name, report} -> {report.description(), short_name} end)

    conn
    |> assign(:reports, reports)
    |> render("index.html",
      layout: {SkateWeb.LayoutView, "barebones.html"},
      title: "Skate Reports"
    )
  end

  @spec run(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def run(conn, params) do
    report = Map.get(Report.all_reports(), params["short_name"])

    if is_nil(report) do
      send_resp(conn, 404, "no report found")
    else
      {:ok, results} = Report.to_csv(report)

      {:ok, dt} =
        Util.Time.now()
        |> FastLocalDatetime.unix_to_datetime(Application.get_env(:skate, :timezone))

      timestamp = DateTime.to_iso8601(dt, :basic)

      send_download(conn, {:binary, results},
        filename: report.short_name() <> "-" <> timestamp <> ".csv"
      )
    end
  end
end
