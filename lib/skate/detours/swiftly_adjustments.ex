defmodule Skate.Detours.SwiftlyAdjustments do
  @moduledoc """
  Executes explicit lifecycle adjustment operations selected by the detours context.

  Retry and lifecycle eligibility remain the responsibility of the caller.
  """

  def execute(operation) do
    execute(
      operation,
      Application.get_env(:skate, :swiftly)[:adjustments_module],
      Application.get_env(:skate, Swiftly.API.ServiceAdjustments)
    )
  end

  def execute({:create, detour}, adjustments_module, opts) do
    {:ok, request} = Swiftly.API.Requests.to_swiftly(detour)
    adjustments_module.create_adjustment_v1(request, opts)
  end

  def execute({:update, detour, adjustment_id}, adjustments_module, opts) do
    {:ok, request} = Swiftly.API.Requests.to_swiftly(detour)

    case adjustment_id do
      nil ->
        {:error, :not_found}

      id ->
        adjustments_module.create_adjustment_v1(request, Keyword.put(opts, :adjustment_id, id))
    end
  end

  def execute({:delete, adjustment_id}, adjustments_module, opts) do
    adjustments_module.delete_adjustment_v1(adjustment_id, opts)
  end
end
