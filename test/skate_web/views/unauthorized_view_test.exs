defmodule SkateWeb.UnauthorizedViewTest do
  use SkateWeb.ConnCase, async: true

  # Bring render/3 and render_to_string/3 for testing custom views
  import Phoenix.Template

  test "renders index.html" do
    assert render_to_string(SkateWeb.UnauthorizedView, "index", "html", []) ==
             "You are not authorized to access this functionality.\n"
  end
end
