defmodule Skate.OpenRouteServiceAPI.DirectionsFormatter.MBTA.English do
  @moduledoc """
  Formats Directions from Open Route Service into MBTA English specific Directions Shorthand.
  """
  require Logger

  @doc """
  Formats a Open Route Service Direction Instruction Map into
    - a Instruction, as a `Map` with a single `:instruction` key
    - or `nil`, which represents discarded instructions
  """
  def format(%{"type" => type, "name" => name} = attrs) do
    case format_instruction(type, name, attrs) do
      nil -> nil
      instruction -> %{instruction: instruction}
    end
  end

  # Converts ORS Instructions into string form, or `nil`
  # Ignore noisy instructions
  defp format_instruction(type, _name, _)
       when type in [:goal, :depart, :straight],
       do: nil

  # Ignore type errors
  defp format_instruction({:error, value}, _name, attrs) do
    Logger.error(
      "Received :error, when formatting instruction, value=#{value} ors_attrs=#{inspect(attrs)}"
    )

    nil
  end

  # ORS uses `-` as a value when a direction doesn't have a name
  # Reject instructions without a name
  defp format_instruction(_type, "-", _),
    do: nil

  defp format_instruction(:left, name, _),
    do: "L - #{name}"

  defp format_instruction(:right, name, _),
    do: "R - #{name}"

  defp format_instruction(:slight_left, name, _),
    do: "Slight L - #{name}"

  defp format_instruction(:slight_right, name, _),
    do: "Slight R - #{name}"

  defp format_instruction(:keep_left, name, _),
    do: "Keep L - #{name}"

  defp format_instruction(:keep_right, name, _),
    do: "Keep R - #{name}"

  defp format_instruction(:sharp_left, name, _),
    do: "L - #{name}"

  defp format_instruction(:sharp_right, name, _),
    do: "R - #{name}"

  # There does not seem to be many `exit_roundabout` instructions, only `enter`
  defp format_instruction(:enter_roundabout, name, %{"exit_number" => exit_number}),
    do: "Roundabout - #{exit_number}#{ordinal_indicator(exit_number)} exit, #{name}"

  # Fallback case, return the original instruction from ORS if we do not have an override
  defp format_instruction(_, _, %{"instruction" => ors_instruction}), do: ors_instruction

  # English Specific Ordinal Indicators
  # > https://en.wikipedia.org/wiki/Ordinal_indicator#English
  # > -st is used with numbers ending in 1
  defp ordinal_indicator(1), do: "st"

  # > -nd is used with numbers ending in 2
  defp ordinal_indicator(2), do: "nd"

  # > -rd is used with numbers ending in 3
  defp ordinal_indicator(3), do: "rd"

  # > As an exception to the above rules, numbers ending with 11, 12, and 13 use -th
  # `11st, 12nd, 13rd`, do not exist
  defp ordinal_indicator(n) when 11 <= n and n <= 13, do: "th"

  # If the number is over 100, we need to check the last two digits for `11-13`
  defp ordinal_indicator(n) when n >= 100, do: ordinal_indicator(rem(n, 100))

  # If the number is over 10, but is not covered by the `11-13` condition above,
  # We need to check the last digit for `1..3`
  defp ordinal_indicator(n) when n >= 10, do: ordinal_indicator(rem(n, 10))

  # > -th is used for all other numbers
  defp ordinal_indicator(_), do: "th"
end
