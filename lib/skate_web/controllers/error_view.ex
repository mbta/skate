defmodule SkateWeb.ErrorView do
  def render(template, assigns) do
    if String.ends_with?(template, ".html") do
      SkateWeb.ErrorHTML.render(template, assigns)
    else
      SkateWeb.ErrorJSON.render(template, assigns)
    end
  end
end
