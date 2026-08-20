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

  @impl Plug
  def init(opts), do: opts

  @impl Plug
  def call(conn, _opts) do
    if MapSet.member?(@exact_probe_paths, conn.request_path) do
      put_private(conn, :logster_log_level, :info)
    else
      conn
    end
  end
end