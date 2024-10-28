defmodule Api.Stream do
  @moduledoc """
  A GenStage for connecting to the API's Server-Sent Event Stream
  capability. Receives events from the API and parses their data.
  Subscribers receive events as `%Api.Stream.Event{}` structs, which
  include the event name and the data as a `%JsonApi{}` struct.

  Required options:
  `:path` (e.g. "/vehicles")
  `:name` -- name of module
  `:subscribe_to` -- pid or name of a ServerSentEventStage
  for the Api.Stream to subscribe to. This should be
  started as part of a supervision tree.

  Other options are made available for tests, and can include:
  - :base_url
  - :api_key
  """

  use GenStage
  alias ServerSentEventStage, as: SSES

  defmodule Event do
    @moduledoc """
    Struct representing a parsed Api server-sent event.
    """
    @type t :: %__MODULE__{
            event: event(),
            data: JsonApi.t() | {:error, any}
          }

    @type event :: :reset | :add | :update | :remove

    @enforce_keys [:event, :data]

    defstruct [
      :event,
      :data
    ]
  end

  @spec start_link(Keyword.t()) :: {:ok, pid}
  def start_link(opts) do
    name = Keyword.fetch!(opts, :name)
    GenStage.start_link(__MODULE__, opts, name: name)
  end

  @doc """
  Builds an option list for a ServerSentEventStage
  which a Api.Stream will subscribe to.
  Each app's ServerSentEventStage should be started
  inside the application's supervision tree.
  """
  @spec build_options(Keyword.t()) :: Keyword.t()
  def build_options(opts) do
    default_options()
    |> Keyword.merge(opts)
    |> set_url()
    |> set_headers()
  end

  @spec default_options :: Keyword.t()
  defp default_options do
    [
      base_url: Application.get_env(:skate, :api_url),
      api_key: Application.get_env(:skate, :api_key)
    ]
  end

  @spec set_url(Keyword.t()) :: Keyword.t()
  defp set_url(opts) do
    path = Keyword.fetch!(opts, :path)
    base_url = Keyword.fetch!(opts, :base_url)

    Keyword.put(opts, :url, Path.join(base_url, path))
  end

  @spec set_headers(Keyword.t()) :: Keyword.t()
  defp set_headers(opts) do
    headers =
      opts
      |> Keyword.fetch!(:api_key)
      |> api_key_header()

    Keyword.put(opts, :headers, headers)
  end

  def init(opts) do
    producer = Keyword.fetch!(opts, :subscribe_to)
    {:producer_consumer, %{}, subscribe_to: [producer]}
  end

  def handle_events(events, _from, state) do
    {:noreply, events |> Enum.map(&parse_event/1) |> Enum.reject(&is_nil(&1)), state}
  end

  @spec api_key_header(String.t() | nil) :: [{String.t(), String.t()}]
  defp api_key_header(nil), do: []
  defp api_key_header(<<key::binary>>), do: [{"x-api-key", key}]

  @spec parse_event(SSES.Event.t()) :: Event.t() | nil
  defp parse_event(%SSES.Event{data: data, event: event}) do
    case event(event) do
      nil ->
        nil

      event_atom ->
        %Event{
          data: JsonApi.parse(data),
          event: event_atom
        }
    end
  end

  @spec event(String.t()) :: Event.event() | nil
  defp event("reset"), do: :reset
  defp event("add"), do: :add
  defp event("update"), do: :update
  defp event("remove"), do: :remove
  defp event(_), do: nil
end
