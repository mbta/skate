defmodule Skate.Schema do
  @moduledoc """
  Skate specific options for Ecto.Schema
  """

  defmacro __using__(_opts) do
    quote do
      use TypedEctoSchema
    end
  end
end
