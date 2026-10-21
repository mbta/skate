defmodule Skate.Radio.SQS.Config do
  @moduledoc false

  @spec commands_queue_url() :: {:ok, String.t()} | :error
  def commands_queue_url do
    with {:ok, keywords} <- Application.fetch_env(:skate, __MODULE__),
         {:ok, url} when is_binary(url) and url != "" <-
           Keyword.fetch(keywords, :commands_queue_url),
         {:ok, %URI{} = _} <- URI.new(url) do
      {:ok, url}
    else
      _ -> :error
    end
  end

  @spec events_queue_url() :: {:ok, String.t()} | :error
  def events_queue_url do
    with {:ok, keywords} <- Application.fetch_env(:skate, __MODULE__),
         {:ok, url} when is_binary(url) and url != "" <-
           Keyword.fetch(keywords, :events_queue_url),
         {:ok, %URI{} = _} <- URI.new(url) do
      {:ok, url}
    else
      _ -> :error
    end
  end
end
