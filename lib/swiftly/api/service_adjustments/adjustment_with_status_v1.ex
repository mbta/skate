defmodule Swiftly.API.ServiceAdjustments.AdjustmentWithStatusV1 do
  @moduledoc """
  Provides struct and type for a AdjustmentWithStatusV1
  """

  @type t :: %__MODULE__{
          adjustmentType: String.t(),
          agencyId: String.t(),
          alertId: String.t() | nil,
          beginTime: DateTime.t(),
          details: Swiftly.API.ServiceAdjustments.AdjustmentDetailsV1.t(),
          endTime: DateTime.t() | nil,
          feedId: String.t() | nil,
          feedName: String.t() | nil,
          id: String.t(),
          notes: String.t() | nil,
          obsolete: String.t() | nil,
          obsoleteTime: DateTime.t() | nil,
          originalId: String.t() | nil,
          reason: String.t() | nil,
          routeShortNames: [String.t()],
          status: String.t(),
          timeCreated: DateTime.t(),
          userFullname: String.t() | nil,
          userId: String.t() | nil,
          validity: String.t(),
          validityReason: String.t() | nil,
          version: String.t()
        }

  defstruct [
    :adjustmentType,
    :agencyId,
    :alertId,
    :beginTime,
    :details,
    :endTime,
    :feedId,
    :feedName,
    :id,
    :notes,
    :obsolete,
    :obsoleteTime,
    :originalId,
    :reason,
    :routeShortNames,
    :status,
    :timeCreated,
    :userFullname,
    :userId,
    :validity,
    :validityReason,
    :version
  ]
end
