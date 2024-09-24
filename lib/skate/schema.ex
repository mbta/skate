defmodule Skate.Schema do
  @moduledoc """
  Skate specific options for Ecto.Schema
  """

  defmacro __using__(_opts) do
    quote do
      @moduledoc section: :ecto

      use TypedEctoSchema
    end
  end
end
