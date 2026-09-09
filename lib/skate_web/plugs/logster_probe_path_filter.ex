defmodule SkateWeb.Plugs.LogsterProbePathFilter do
  @moduledoc """
  Downgrades request-log severity for known scanner probe paths that return 4xx.
  Surface Sentry errors if known exploit paths are successfully accessed with 200.

  These paths are routinely hit by bots and can create noisy 404 warning logs.
  """

  @behaviour Plug

  import Plug.Conn, only: [put_private: 3, register_before_send: 2]

  @exact_probe_paths MapSet.new([
                       "/apple-touch-icon-precomposed.png",
                       "/apple-touch-icon.png",
                       "/login/.git/config",
                       "/.well-known/assetlinks.json"
                     ])

  @known_exploit_prefixes [
    "/cms/vendor/phpunit/phpunit/src/Util/PHP/",
    "/vendor/phpunit/phpunit/src/Util/PHP/"
  ]

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    cond do
      String.starts_with?(conn.request_path, @known_exploit_prefixes) ->
        register_probe_path_log_level(conn)

      MapSet.member?(@exact_probe_paths, conn.request_path) ->
        put_private(conn, :logster_log_level, :info)

      true ->
        conn
    end
  end

  defp register_probe_path_log_level(conn) do
    request_path = conn.request_path

    register_before_send(conn, fn conn ->
      update_log_level(conn, request_path)
    end)
  end

  defp update_log_level(%{status: 200} = conn, request_path) do
    Sentry.capture_message("Probe path returned 200",
      extra: %{path: request_path, method: conn.method, status: conn.status}
    )

    put_private(conn, :logster_log_level, :error)
  end

  defp update_log_level(%{status: status} = conn, _request_path)
       when status >= 400 and status < 500 do
    put_private(conn, :logster_log_level, :info)
  end

  defp update_log_level(conn, _request_path), do: conn
end
