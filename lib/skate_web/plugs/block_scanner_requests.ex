defmodule SkateWeb.Plugs.BlockScannerRequests do
  @moduledoc """
  Short-circuits requests matching common vulnerability-scanner probes, e.g.
  `/index.php` path-traversal attempts hunting for PHP/CGI misconfigurations
  that don't exist in this Phoenix app. Skips the router/logger noise by
  responding 404 immediately and demoting the request's log level.
  """

  import Plug.Conn

  # Requests for unsupported stacks, exposed metadata/credential files,
  # traversal/null-byte probes, or fake file-fetch/proxy attempts.
  @unsupported_stack_regex ~r{(\.(php\d?|phtml|phar|asp|aspx|cgi)(?:$|[/?#])|/(?:wp-admin|wp-login|wp-content|wp-includes)(?:$|[/?#]))}i
  @traversal_regex ~r{(?:\.\.|%2e%2e)(?:/|\\|%2f|%5c)}i
  @null_byte_regex ~r{(?:%00|\\u0000|\x00)}i
  @sensitive_file_regex ~r{(?:^|/)(?:\.git/config|\.env(?:\.[a-z0-9_-]+)?|\.aws/credentials(?:\.[^/?#]+)?|\.azure/credentials(?:\.[^/?#]+)?|terraform\.tfstate(?:\.(?:orig|backup|bak|old))?|\.continue/config\.json|config/anthropic\.json|boot\.ini|win\.ini|etc/passwd)(?:$|[/?#])}i
  @file_fetch_regex ~r{(?:^|[?&])(?:url|uri|path|endpoint)=.*(?:file:|file%3a|/root/|/etc/passwd|\.aws/credentials|\.azure/credentials)}i

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
    request =
      conn.request_path <> if(conn.query_string == "", do: "", else: "?#{conn.query_string}")

    Enum.any?(
      [
        @unsupported_stack_regex,
        @traversal_regex,
        @null_byte_regex,
        @sensitive_file_regex,
        @file_fetch_regex
      ],
      &String.match?(request, &1)
    )
  end
end
