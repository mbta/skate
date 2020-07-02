defmodule SkateWeb.DeliberatelyFailController do
  require Logger
  use SkateWeb, :controller

  def index(conn, _params) do
    some_operation(1)
    # We'll never actually get here...
    conn
  end

  def some_operation(2) do
  end
end
