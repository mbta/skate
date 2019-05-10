defmodule Concentrate.Reporter.Consumer do
  @moduledoc """
  Consumes output from MergeFilter and generates log output.
  """
  use GenStage
  require Logger

  def start_link(opts) do
    GenStage.start_link(__MODULE__, opts)
  end

  @impl GenStage
  def init(opts) do
    {module, opts} = Keyword.pop(opts, :module)
    module_state = module.init()
    {:consumer, {module, module_state}, opts}
  end

  @impl GenStage
  def handle_events(events, _from, {module, module_state}) do
    parsed = List.last(events)
    {output, module_state} = module.log(parsed, module_state)

    if output != [] do
      Logger.info(fn ->
        report =
          output
          |> Enum.map(&log_item/1)
          |> Enum.join(" ")

        "#{module} report: #{report}"
      end)
    end

    {:noreply, [], {module, module_state}}
  end

  defp log_item({key, value}) when is_binary(value) do
    "#{key}=#{inspect(value)}"
  end

  defp log_item({key, value}) do
    "#{key}=#{value}"
  end
end
