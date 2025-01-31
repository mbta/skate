defmodule SkateWeb.DetoursAdminHTML do
  use SkateWeb, :html

  embed_templates "detours_admin_html/*"

  def extract_pre(map, field) do
    map
    |> Map.get(field)
    |> extract_pre()
  end

  def extract_pre(data) do
    inspect(data, pretty: true, printable_limit: :infinity, limit: :infinity)
  end
end
