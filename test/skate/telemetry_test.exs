defmodule Skate.TelemetryTest do
  @moduledoc false
  use Skate.DataCase
  import TelemetryTest
  import Skate.Factory
  import ExUnit.CaptureLog, only: [capture_log: 2]
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Skate.Detours.Detours

  setup [:telemetry_listen]

  defp detour_fixture do
    insert(:detour)
  end

  @tag telemetry_listen: [:skate, :repo, :query]
  test "logs exception info" do
    set_log_level(:info)
    detour = detour_fixture()

    log =
      capture_log([level: :info], fn ->
        assert Skate.Repo.preload(Detours.list_detours(), :author) == [detour]
      end)

    assert_receive {:telemetry_event,
                    %{
                      event: [:skate, :repo, :query],
                      measurements: %{decode_time: _, query_time: _, queue_time: _, total_time: _},
                      metadata: %{query: _, result: _, source: "detours"}
                    }}

    assert log =~ "Telemetry for Detours query"
  end
end
