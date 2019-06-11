defmodule Concentrate.DataDiscrepancy do
  @type t :: %__MODULE__{
          attribute: String.t(),
          sources: [source()]
        }

  @enforce_keys [:attribute]

  @type source :: %{
          id: String.t(),
          value: String.t()
        }

  defstruct [
    :attribute,
    sources: []
  ]
end
