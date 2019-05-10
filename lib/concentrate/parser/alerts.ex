defmodule Concentrate.Parser.Alerts do
  @moduledoc """
  Parser for alerts. Defers to GTFSRealtime or GTFSRealtimeEnhanced depending on the body.
  """
  alias Concentrate.Parser
  @behaviour Concentrate.Parser

  def parse(body, opts) do
    module = parse_module(body)
    module.parse(body, opts)
  end

  defp parse_module("{" <> _), do: Parser.GTFSRealtimeEnhanced
  defp parse_module(_), do: Parser.GTFSRealtime
end
