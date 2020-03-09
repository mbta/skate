defmodule Concentrate.PipelineHelpers do
  @spec source(term(), String.t(), module()) :: Supervisor.child_spec()
  @spec source(term(), String.t(), module(), keyword()) :: Supervisor.child_spec()
  def source(source, url, parser, opts \\ []) do
    Supervisor.child_spec(
      {
        Concentrate.Producer.HTTP,
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
