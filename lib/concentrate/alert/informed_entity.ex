defmodule Concentrate.Alert.InformedEntity do
  @moduledoc """
  The type of service which is affected by this alert.
  """
  import Concentrate.StructHelpers
  import Kernel, except: [match?: 2], warn: false

  defstruct_accessors([
    :trip_id,
    :route_type,
    :route_id,
    :direction_id,
    :stop_id,
    activities: ["BOARD", "EXIT", "RIDE"]
  ])

  @spec match?(t, Keyword.t()) :: boolean
  def match?(%__MODULE__{} = entity, keywords) when is_list(keywords) do
    do_match?(entity, keywords, false)
  end

  defp do_match?(_entity, [], had_match?) do
    had_match?
  end

  defp do_match?(entity, [{_, nil} | rest], had_match?) do
    do_match?(entity, rest, had_match?)
  end

  for field <- ~w(trip_id route_type route_id direction_id stop_id)a do
    defp do_match?(%{unquote(field) => value} = entity, [{unquote(field), value} | rest], _) do
      # if the value matches, then contine trying to match
      do_match?(entity, rest, true)
    end

    defp do_match?(
           %{unquote(field) => nil} = entity,
           [{unquote(field), _value} | rest],
           had_match?
         ) do
      # if the alert has a nil value, then it matches by default
      do_match?(entity, rest, had_match?)
    end
  end

  defp do_match?(_entity, _keywords, _had_match?) do
    false
  end
end
