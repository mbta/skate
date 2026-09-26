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
        detour =
          build(
            :detour,
            copied_from_id: @copied_from_id,
            is_text_only: @is_text_only,
            activated_at: DateTime.utc_now(),
            updated_at: NaiveDateTime.utc_now()
          )

        detour =
          if @is_text_only do
            detour
          else
            with_finished_state(detour, missed_stops: ["101", "102"])
          end

        assert %Report{} = report = Report.from!(detour)
        assert report.copied_from == @copied_from_id

        case @expected_type do
          :integer -> assert is_integer(report.copied_from)
          nil -> assert is_nil(report.copied_from)
        end
      end
    end
  end
end
