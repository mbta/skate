defmodule Concentrate.Pipeline do
  @moduledoc """
  Behavior for defining a concentrate pipeline. Generally these included sources and consumers, and sometimes also a merge step.
  """

  @callback init(keyword()) :: [Supervisor.child_spec()]

  @spec start_link(module(), keyword()) :: Supervisor.on_start()
  def start_link(module, opts) do
    children = module.init(opts)

    Supervisor.start_link(children, strategy: :rest_for_one)
  end

  @spec child_spec(keyword()) :: Supervisor.child_spec()
  def child_spec(opts) do
    module = Keyword.fetch!(opts, :module)

    %{
      type: :supervisor,
      id: module,
      start: {__MODULE__, :start_link, [module, opts]}
    }
  end

  @spec source(term(), String.t(), module()) :: Supervisor.child_spec()
  @spec source(term(), String.t(), module(), keyword()) :: Supervisor.child_spec()
  def source(source, url, parser, opts \\ []) do
    Supervisor.child_spec(
      {
        HttpStage,
        {url, [name: source, parser: parser] ++ opts}
      },
      id: source
    )
  end

  @spec consumer(module(), term()) :: Supervisor.child_spec()
  def consumer(module, provider) do
    Supervisor.child_spec({module, subscribe_to: [{provider, [max_demand: 1]}]}, [])
  end
end
