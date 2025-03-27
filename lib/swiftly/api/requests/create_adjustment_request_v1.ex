defmodule Swiftly.Api.Requests.CreateAdjustmentRequestV1 do
  @moduledoc """
  Module to represent a CreateAdjustmentRequestV1 request for swiftly
  """

  defstruct [
    :feedId,
    :feedName,
    :notes,
    :details
  ]

  @type t :: %__MODULE__{
          feedId: binary(),
          feedName: binary(),
          notes: binary(),
          details: Swiftly.Api.Requests.DetourV0CreationDetailsV1.t()
        }
end
