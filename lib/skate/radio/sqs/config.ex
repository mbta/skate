defmodule Skate.Radio.SQS.Config do
  @moduledoc false

  alias Skate.Radio.SQS.Constants

  # The guard clauses assert we will only convert trusted input into atoms
  # sobelow_skip ["DOS.BinToAtom"]
  @spec queue_url(Constants.queue_name()) :: {:ok, String.t()} | :error
  def queue_url(queue_name) do
    with true <- queue_name in Constants.queue_names(),
         {:ok, keywords} <- Application.fetch_env(:skate, __MODULE__),
         {:ok, url} when is_binary(url) and url != "" <-
           Keyword.fetch(keywords, :"#{queue_name}_queue_url"),
         {:ok, %URI{} = _} <- URI.new(url) do
      {:ok, url}
    else
      _ -> :error
    end
  end
end
