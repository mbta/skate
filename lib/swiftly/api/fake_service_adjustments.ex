defmodule Swiftly.API.FakeServiceAdjustments do
  @moduledoc """
  Provides faked implementation for swfitly service adjustments
  """

  @spec create_adjustment_v1(
          Swiftly.API.ServiceAdjustments.CreateAdjustmentRequestV1.t(),
          keyword
        ) :: :ok
  def create_adjustment_v1(_, _ \\ []) do
    :ok
  end

  @spec delete_adjustment_v1(Swiftly.Api.ServiceAdjustments.AdjustmentId.t(), keyword) ::
          :ok
  def delete_adjustment_v1(_, _ \\ []) do
    :ok
  end

  @spec get_adjustments_v1(keyword) ::
          :ok
  def get_adjustments_v1(_ \\ []) do
    :ok
  end
end
