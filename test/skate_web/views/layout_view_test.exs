defmodule SkateWeb.LayoutViewTest do
  use SkateWeb.ConnCase, async: true

  alias SkateWeb.LayoutView

  describe "record_fullstory?/0" do
    test "returns true if the :record_fullstory env is true" do
      real_record_fullstory = Application.get_env(:skate, :record_fullstory)

      on_exit(fn ->
        Application.put_env(:skate, :record_fullstory, real_record_fullstory)
      end)

      Application.put_env(:skate, :record_fullstory, true)

      assert LayoutView.record_fullstory?()
    end

    test "returns false if the :record_fullstory env is false" do
      real_record_fullstory = Application.get_env(:skate, :record_fullstory)

      on_exit(fn ->
        Application.put_env(:skate, :record_fullstory, real_record_fullstory)
      end)

      Application.put_env(:skate, :record_fullstory, false)

      refute LayoutView.record_fullstory?()
    end

    test "returns false if the :record_fullstory env is missing" do
      real_record_fullstory = Application.get_env(:skate, :record_fullstory)

      on_exit(fn ->
        Application.put_env(:skate, :record_fullstory, real_record_fullstory)
      end)

      Application.put_env(:skate, :record_fullstory, nil)

      refute LayoutView.record_fullstory?()
    end
  end
end
