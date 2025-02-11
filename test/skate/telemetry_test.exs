defmodule Skate.TelemetryTest do
  @moduledoc false
  use Skate.DataCase
  import Skate.Factory
  import ExUnit.CaptureLog, only: [capture_log: 2]
  import Test.Support.Helpers, only: [set_log_level: 1]

  alias Skate.Detours.Detours
  alias Skate.Detours.Db.Detour

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
    %Detour{id: id} = detour_fixture()

    log =
      capture_log([level: :info], fn ->
        assert [%Detour{id: ^id}] = Detours.list_detours([:id])
      end)

    assert_receive {[:skate, :repo, :query], _ref,
                    %{decode_time: _, query_time: _, total_time: _},
                    %{
                      query: _,
                      result: {:ok, %{connection_id: _, num_rows: _}},
                      source: "detours"
                    }}

    assert log =~ "Telemetry for db query, source=detours"
  end
end
