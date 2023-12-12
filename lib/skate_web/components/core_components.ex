defmodule SkateWeb.CoreComponents do
  @moduledoc """
  Provides core UI components.
  """

  def static_content_route(conn, path) do
    {static_href_module, static_href_fn} = Application.get_env(:skate, :static_href)
    static_href = fn conn, path -> apply(static_href_module, static_href_fn, [conn, path]) end

    static_href.(conn, path)
  end
end
