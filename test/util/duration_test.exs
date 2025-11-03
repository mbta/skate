defmodule Util.DurationTest do
  use ExUnit.Case
  import ExUnit.CaptureLog, only: [capture_log: 1]

  alias Util.Duration

  describe "log_duration/3" do
    test "logs how long a function took, and returns the result" do
      old_level = Logger.level()

      on_exit(fn ->
        Logger.configure(level: old_level)
      end)

      Logger.configure(level: :info)

      log =
        capture_log(fn ->
          assert Duration.log_duration(__MODULE__, :log_duration_test, [1, 2]) == []
          assert_receive {:log_duration_test, 1, 2}
        end)

      assert log =~ "duration="
    end
  end

  # Mock function for testing log_duration
  def log_duration_test(arg_1, arg_2) do
    send(self(), {:log_duration_test, arg_1, arg_2})
    []
  end
end
