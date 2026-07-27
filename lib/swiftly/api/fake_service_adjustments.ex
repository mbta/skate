defmodule Swiftly.API.FakeServiceAdjustments do
  @moduledoc """
  Provides faked implementation for swfitly service adjustments
  """

  @spec create_adjustment_v1(
          Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1.t(),
          keyword
        ) :: {:ok, Swiftly.API.ServiceAdjustments.AdjustmentIdResponse.t()}
  def create_adjustment_v1(_, _ \\ []) do
    {:ok, %{adjustmentId: "0a9b90f5-f16a-4819-b051-565b39878530"}}
  end

  @spec delete_adjustment_v1(Swiftly.Api.ServiceAdjustments.AdjustmentId.t(), keyword) ::
          {:ok, nil}
  def delete_adjustment_v1(_, _ \\ []) do
    {:ok, nil}
  end

  # @spec get_adjustments_v1(keyword) ::
  #         {:ok, Swiftly.API.ServiceAdjustments.AdjustmentsResponseV1.t()}
  def get_adjustments_v1(_ \\ []) do
    {:ok, %{adjustments: []}}
  end
end
