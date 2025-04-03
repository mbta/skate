defmodule Swiftly.API.ServiceAdjustments.AdjustmentWithStatusV1 do
  @moduledoc """
  Provides struct and type for a AdjustmentWithStatusV1
  """

  @type t :: %__MODULE__{
          adjustmentType: String.t(),
          feedId: String.t() | nil,
          id: String.t(),
          notes: String.t() | nil,
          originalId: String.t() | nil,
          status: String.t(),
          validity: String.t(),
          validityReason: String.t() | nil
        }

  defstruct [
    :adjustmentType,
    :feedId,
    :id,
    :notes,
    :originalId,
    :status,
    :validity,
    :validityReason
  ]

  def load(adjustment) do
    fields =
      Enum.map(__MODULE__.__info__(:struct), fn %{field: field} -> Atom.to_string(field) end)

    atomized_adjustment =
      adjustment
      |> Map.take(fields)
      |> Map.new(fn {k, v} -> {String.to_atom(k), v} end)

    struct(__MODULE__, atomized_adjustment)
  end
end
