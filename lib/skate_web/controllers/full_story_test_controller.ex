defmodule SkateWeb.FullStoryTestController do
  use SkateWeb, :controller

  def index(conn, _params) do
    render(conn, "index.html", layout: {SkateWeb.FullStoryTestView, "layout.html"})
  end
end
