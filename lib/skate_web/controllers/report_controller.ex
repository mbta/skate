defmodule SkateWeb.ReportController do
  @moduledoc """
  Provides a list of available reports with links to run each one
  individually and return a CSV.
  """

  use SkateWeb, :controller

  alias Skate.Detours.Db.Detour

  @spec index(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def index(conn, _params) do
    reports =
      Enum.map(Report.all_reports(), fn {short_name, report} ->
        {report.description(), short_name}
      end)

    conn
    |> assign(:reports, reports)
    |> render(:index,
      layout: {SkateWeb.Layouts, "barebones.html"},
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

      timestamp =
        Application.get_env(:skate, :timezone)
        |> DateTime.now!()
        |> DateTime.truncate(:second)
        |> DateTime.to_iso8601(:basic)

      send_download(conn, {:binary, results},
        filename: report.short_name() <> "-" <> timestamp <> ".csv"
      )
    end
  end

  @spec detours(Plug.Conn.t(), map()) :: Plug.Conn.t()
  def detours(conn, %{"status" => status}) do
    valid_statuses = Enum.map(Ecto.Enum.values(Detour, :status), &to_string/1)

    with true <- status in valid_statuses,
         {:ok, bucket} when is_binary(bucket) <- Application.fetch_env(:skate, :s3_bucket),
         {:ok, %{status_code: status_code, body: body}} <-
           ExAws.request(
             ExAws.S3.get_object(bucket, "detours/#{status}.ndjson"),
             Application.get_env(:ex_aws, :request_config_overrides, %{})
           ),
         true <- status_code in 200..299 do
      conn
      |> put_resp_content_type("application/x-ndjson")
      |> send_resp(:ok, body)
    else
      false ->
        send_resp(conn, :bad_request, "invalid status")

      :error ->
        send_resp(conn, :internal_server_error, "missing s3 bucket config")

      {:ok, _} ->
        send_resp(conn, :not_found, "no export found")

      {:error, _} ->
        send_resp(conn, :not_found, "no export found")
    end
  end
end
