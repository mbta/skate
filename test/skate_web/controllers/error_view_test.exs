defmodule SkateWeb.ErrorViewTest do
  use SkateWeb.ConnCase, async: true

  # Bring render_to_string/4 for testing custom views
  import Phoenix.Template

  test "renders 404.html" do
    assert render_to_string(SkateWeb.ErrorView, "404", "html", []) == "Not Found"
  end

  test "renders 500.html" do
    assert render_to_string(SkateWeb.ErrorView, "500", "html", []) == "Internal Server Error"
  end

  test "renders 404.json" do
    assert render_to_string(SkateWeb.ErrorView, "404", "json", []) ==
             "{\"errors\":[{\"detail\":\"Not Found\"}]}"
  end

  test "renders 500.json" do
    assert render_to_string(SkateWeb.ErrorView, "500", "json", []) ==
             "{\"errors\":[{\"detail\":\"Internal Server Error\"}]}"
  end
end
