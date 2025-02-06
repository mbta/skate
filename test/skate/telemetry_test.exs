defmodule Skate.TelemetryTest do
  @moduledoc false
  use Skate.DataCase
  import Skate.Factory
  import ExUnit.CaptureLog, only: [capture_log: 2]
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Skate.Detours.Detours

  setup tags do
    if events = tags[:telemetry_listen] do
      ref = :telemetry_test.attach_event_handlers(self(), events)

      on_exit(fn -> :telemetry.detach(ref) end)

      %{telemetry_ref: ref}
    end
  end

  defp detour_fixture do
    insert(:detour)
  end

  @tag telemetry_listen: [[:skate, :repo, :query]]
  test "logs exception info" do
    set_log_level(:info)
    detour = detour_fixture()

    log =
      capture_log([level: :info], fn ->
        assert Skate.Repo.preload(Detours.list_detours(), :author) == [detour]
      end)

    assert_receive {[:skate, :repo, :query], _ref,
                      %{decode_time: _, query_time: _, queue_time: _, total_time: _},
                      %{query: _, result: _, source: "detours"}
                    }

    assert log =~ "Telemetry for Detours query"
  end
end
