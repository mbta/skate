defmodule Skate.Notifications.NotificationStateTest do
  use ExUnit.Case

  alias Skate.Notifications.NotificationState

  describe "cast/1" do
    test "works with a valid state" do
      assert NotificationState.cast(:unread) == {:ok, :unread}
      assert NotificationState.cast(:read) == {:ok, :read}
      assert NotificationState.cast(:deleted) == {:ok, :deleted}
    end

    test "errors on an invalid state" do
      assert NotificationState.cast(:foobar) == :error
    end
  end
end
