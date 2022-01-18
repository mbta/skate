defmodule SkateWeb.RouteTabsController do
  use SkateWeb, :controller

  def update(conn, %{"route_tabs" => _route_tabs} = _params) do
    json(conn, %{data: []})
  end
end
