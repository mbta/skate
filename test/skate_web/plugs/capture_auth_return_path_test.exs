defmodule SkateWeb.Plugs.CaptureAuthReturnPathTest do
  use ExUnit.Case, async: false
  use SkateWeb.ConnCase
  use Plug.Test

  doctest SkateWeb.Plugs.CaptureAuthReturnPath

  def conn_for_path(path) do
    :get
    |> conn(path)
    |> Plug.Session.call(Plug.Session.init(store: :cookie, key: "_app", signing_salt: "shaker"))
  end
end
