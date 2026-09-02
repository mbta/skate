defmodule SkateWeb.Plugs.BlockScannerRequests do
  @moduledoc """
  Short-circuits requests matching common vulnerability-scanner probes, e.g.
  `/index.php` path-traversal attempts hunting for PHP/CGI misconfigurations
  that don't exist in this Phoenix app. Skips the router/logger noise by
  responding 404 immediately and demoting the request's log level.
  """

  import Plug.Conn

  # Requests for PHP/CGI/ASP files, `wp-*` WordPress paths, or `..` traversal
  # sequences (raw or percent-encoded) in the path or query string.
  @scanner_regex ~r{(\.(php\d?|phtml|asp|aspx|cgi)$|/wp-|\.\.(/|\\|%2f|%5c))}i

  def init(opts), do: opts

  def call(conn, _opts) do
    if scanner_request?(conn) do
      conn
      |> put_private(:logster_log_level, :debug)
      |> send_resp(404, "")
      |> halt()
    else
      conn
    end
  end

  defp scanner_request?(conn) do
    String.match?(conn.request_path, @scanner_regex) or
      String.match?(conn.query_string, @scanner_regex)
  end
end
