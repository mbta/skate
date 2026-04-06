defmodule Skate.Schema do
  @moduledoc """
  Skate specific options for Ecto.Schema
  """

  defmacro __using__(_opts) do
    quote do
      @moduledoc section: :ecto
      @timestamps_opts [type: :naive_datetime]

      use TypedEctoSchema
    end
  end
end
