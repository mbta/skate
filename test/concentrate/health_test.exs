defmodule Concentrate.HealthTest do
  use ExUnit.Case
  import ExUnit.CaptureLog
  alias Concentrate.Health

  describe "healthy?" do
    test "crashes by default" do
      Health.healthy?(:health_false)
      assert false
    catch
      :exit, _ ->
        true
    end

    test "true when the server is running" do
      {:ok, pid} = Health.start_link([])
      assert Health.healthy?(pid)
    end

    test "logs a message" do
      {:ok, pid} = Health.start_link([])

      log =
        capture_log(fn ->
          Health.healthy?(pid)
        end)

      assert log =~ "Health"
    end
  end
end
