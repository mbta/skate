defmodule SkateWeb.DetoursAdminHTML do
  use SkateWeb, :html

  embed_templates "detours_admin_html/*"

  def extract_pre(map, field) do
    inspect(Map.get(map, field), pretty: true, printable_limit: :infinity, limit: :infinity)
  end
end
