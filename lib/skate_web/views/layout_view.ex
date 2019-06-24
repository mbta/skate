defmodule SkateWeb.LayoutView do
  use SkateWeb, :view

  @spec record_fullstory?() :: boolean
  def record_fullstory?, do: Application.get_env(:skate, :record_fullstory, false)
end
