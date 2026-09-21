defmodule Skate.Detours.DetourTest do
  use ExUnit.Case, async: true

  alias Skate.Detours.Detour.Report
  import Skate.Factory

  describe "Report.from!/1" do
    for is_text_only <- [true, false],
        {copied_from_id, expected_type} <- [{12_345, :integer}, {nil, :nil}] do
      @is_text_only is_text_only
      @copied_from_id copied_from_id
      @expected_type expected_type

      test "populates copied_from=#{inspect(copied_from_id)} when is_text_only=#{is_text_only}" do
        detour = build_test_detour(copied_from_id: @copied_from_id, is_text_only: @is_text_only)

        assert %Report{} = report = Report.from!(detour)
        assert report.copied_from == @copied_from_id

        case @expected_type do
          :integer -> assert is_integer(report.copied_from)
          :nil -> assert is_nil(report.copied_from)
        end
      end
    end
  end

  # Constructs a `%Skate.Detours.Db.Detour{}` test fixture.
  #
  # Non-text-only detours (`is_text_only: false`) require full route geometry
  # and connection point keys in the snapshot state, which are populated here
  # so `Report.from!/1` can successfully parse both detour variants.
  defp build_test_detour(opts) do
    copied_from_id = Keyword.get(opts, :copied_from_id)
    is_text_only = Keyword.get(opts, :is_text_only, true)

    detour =
      :detour
      |> build(
        copied_from_id: copied_from_id,
        is_text_only: is_text_only,
        activated_at: DateTime.utc_now(),
        updated_at: NaiveDateTime.utc_now()
      )

    if is_text_only do
      detour
    else
      detour
      |> with_missed_stops(["101", "102"])
      |> populate_finished_detour_state()
    end
  end

  # Injects the minimal nested map structure required by non-text-only detours.
  #
  # When `is_text_only` is false, `Report.from!/1` extracts connection points,
  # route segments, and bypassed coordinates from `state["context"]["finishedDetour"]`,
  # raising an `ArgumentError` or `KeyError` if these keys are absent.
  defp populate_finished_detour_state(detour) do
    %{
      detour
      | state:
          detour.state
          |> put_in(
            ["context", "finishedDetour", "connectionPoint"],
            %{"start" => %{"id" => "101"}, "end" => %{"id" => "102"}}
          )
          |> put_in(
            ["context", "finishedDetour", "routeSegments"],
            %{"beforeDetour" => [], "afterDetour" => [], "detour" => []}
          )
          |> put_in(
            ["context", "finishedDetour", "detourShape"],
            %{"coordinates" => []}
          )
    }
  end
end
