defmodule Concentrate.Sink.ConsumerSupervisor do
  @moduledoc """
  ConsumerSupervisor is responsible for managing the pool of sink
  processes.
  """
  @supervisor_opts ~w(subscribe_to)a
  import Supervisor.Spec, only: [worker: 3]

  def start_link({sink_child, opts}) do
    supervisor_opts =
      opts
      |> Keyword.take(@supervisor_opts)
      |> Keyword.put(:strategy, :one_for_one)

    opts = Keyword.drop(opts, @supervisor_opts)

    children = [
      worker(sink_child, [opts], restart: :temporary)
    ]

    ConsumerSupervisor.start_link(children, supervisor_opts)
  end

  def child_spec({sink_child, opts}) do
    %{
      id: {__MODULE__, sink_child},
      type: :supervisor,
      start: {__MODULE__, :start_link, [{sink_child, opts}]}
    }
  end
end
