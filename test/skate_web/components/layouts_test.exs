defmodule SkateWeb.LayoutsTest do
  use SkateWeb.ConnCase
  import Test.Support.Helpers

  alias SkateWeb.Layouts

  describe "record_fullstory?/0" do
    test "returns true if the :record_fullstory env is true" do
      reassign_env(:skate, :record_fullstory, true)

      assert Layouts.record_fullstory?()
    end

    test "returns false if the :record_fullstory env is false" do
      reassign_env(:skate, :record_fullstory, false)

      refute Layouts.record_fullstory?()
    end

    test "returns false if the :record_fullstory env is missing" do
      reassign_env(:skate, :record_fullstory, nil)

      refute Layouts.record_fullstory?()
    end
  end

  describe "record_appcues?/0" do
    test "returns true if the :record_appcues env is true" do
      reassign_env(:skate, :record_appcues, true)

      assert Layouts.record_appcues?()
    end

    test "returns false if the :record_appcues env is false" do
      reassign_env(:skate, :record_appcues, false)

      refute Layouts.record_sentry?()
    end

    test "returns false if the :record_appcues env is missing" do
      reassign_env(:skate, :record_appcues, nil)

      refute Layouts.record_sentry?()
    end
  end

  describe "record_sentry?/0" do
    test "returns true if the :sentry_frontend_dsn env is not nil" do
      reassign_env(:skate, :sentry_frontend_dsn, "true")

      assert Layouts.record_sentry?()
    end

    test "returns false if the :sentry_frontend_dsn env is missing or nil" do
      reassign_env(:skate, :sentry_frontend_dsn, nil)

      refute Layouts.record_sentry?()
    end
  end
end
