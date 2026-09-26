defmodule Skate.Detours.DetourTest do
  use ExUnit.Case, async: true

  alias Skate.Detours.Detour.Report
  import Skate.Factory

  describe "Report.from!/1" do
    for is_text_only <- [true, false],
        {copied_from_id, expected_type} <- [{12_345, :integer}, {nil, nil}] do
      @is_text_only is_text_only
      @copied_from_id copied_from_id
      @expected_type expected_type

      test "populates copied_from=#{inspect(copied_from_id)} when is_text_only=#{is_text_only}" do
        detour = build_test_detour(copied_from_id: @copied_from_id, is_text_only: @is_text_only)

        assert %Report{} = report = Report.from!(detour)
        assert report.copied_from == @copied_from_id

        case @expected_type do
          :integer -> assert is_integer(report.copied_from)
          nil -> assert is_nil(report.copied_from)
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
      build(
        :detour,
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
      |> with_finished_state()
    end
  end
end
