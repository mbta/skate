defmodule SkateWeb.DeliberateErrorController do
  use SkateWeb, :controller

  def index(conn, _params) do
    raise "This is a deliberate error to test Sentry in SkateWeb."
    conn
  end
end
