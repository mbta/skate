defmodule Skate.Example do
  @spec is_even(integer()) :: boolean()
  def is_even(n) do
    case rem(n, 2) do
      0 -> true
      1 -> false
      _ -> raise RuntimeError
    end
  end
end
