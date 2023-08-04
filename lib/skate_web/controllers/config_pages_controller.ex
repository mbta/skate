defmodule SkateWeb.ConfigPagesController do
  @moduledoc """
  Redirects requests to the `:external` parameter in the connection's
  `SkateWeb.ConfigPagesController` private data.
  """

  use SkateWeb, :controller

  def index(conn, _params) do
    url = conn.private[__MODULE__].external

    redirect(conn, external: url)
  end
end
