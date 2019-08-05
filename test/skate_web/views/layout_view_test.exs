defmodule SkateWeb.LayoutViewTest do
  use SkateWeb.ConnCase, async: true
  import Test.Support.Helpers

  alias SkateWeb.LayoutView

  describe "record_fullstory?/0" do
    test "returns true if the :record_fullstory env is true" do
      reassign_env(:skate, :record_fullstory, true)

      assert LayoutView.record_fullstory?()
    end

    test "returns false if the :record_fullstory env is false" do
      reassign_env(:skate, :record_fullstory, false)

      refute LayoutView.record_fullstory?()
    end

    test "returns false if the :record_fullstory env is missing" do
      reassign_env(:skate, :record_fullstory, nil)

      refute LayoutView.record_fullstory?()
    end
  end
end
