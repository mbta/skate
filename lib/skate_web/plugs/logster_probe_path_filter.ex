defmodule SkateWeb.Plugs.LogsterProbePathFilter do
  @moduledoc """
  Downgrades request-log severity for known scanner probe paths.

  These paths are routinely hit by bots and can create noisy 404 warning logs.
  """

  @behaviour Plug

  import Plug.Conn, only: [put_private: 3]

  @exact_probe_paths MapSet.new([
                      "/apple-touch-icon-precomposed.png",
                      "/apple-touch-icon.png",
                      "/login/.git/config"
                    ])

  @probe_path_prefixes [
    "/cms/vendor/phpunit/phpunit/src/Util/PHP/",
    "/vendor/phpunit/phpunit/src/Util/PHP/"
  ]

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    if probe_path?(conn.request_path) do
      put_private(conn, :logster_log_level, :info)
    else
      conn
    end
  end

  defp probe_path?(request_path) do
    MapSet.member?(@exact_probe_paths, request_path) ||
      String.starts_with?(request_path, @probe_path_prefixes)
  end
end