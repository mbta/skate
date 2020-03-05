defmodule Concentrate.Pipeline do
  def source(source, url, parser, opts \\ []) do
    Supervisor.child_spec(
      {
        Concentrate.Producer.HTTP,
        {url, [name: source, parser: parser] ++ opts}
      },
      id: source
    )
  end

  def consumer(module, id) do
    Supervisor.child_spec(
      {module, subscribe_to: [merge: [max_demand: 1]]},
      id: id
    )
  end
end
