defmodule Skate.Radio.Store do
  @moduledoc "In-memory storage for radio entities, organized by entity type and ID."

  use Agent

  @types ["rtts", "prtts", "emergencies", "calls"]
  @type entity_type :: String.t()

  @spec types() :: [entity_type()]
  def types, do: @types

  @spec start_link(keyword()) :: Agent.on_start()
  def start_link(opts \\ []) do
    name = Keyword.get(opts, :name, __MODULE__)
    Agent.start_link(fn -> Map.new(@types, &{&1, %{}}) end, name: name)
  end

  @spec all(entity_type(), GenServer.server()) :: map()
  def all(type, name \\ __MODULE__) when type in @types do
    Agent.get(name, &Map.fetch!(&1, type))
  end

  @spec get(entity_type(), String.t(), GenServer.server()) :: map() | nil
  def get(type, id, name \\ __MODULE__) when type in @types do
    Agent.get(name, &get_in(&1, [type, id]))
  end

  @spec set(entity_type(), String.t(), map(), GenServer.server()) :: :ok
  def set(type, id, entity, name \\ __MODULE__)
      when type in @types and is_binary(id) and id != "" and is_map(entity) do
    {updated_collection, entity_data} =
      Agent.get_and_update(name, fn state ->
        entities = Map.fetch!(state, type)
        updated_entities = Map.put(entities, id, entity)
        updated_state = Map.put(state, type, updated_entities)

        {{updated_entities, Map.get(updated_entities, id)}, updated_state}
      end)

    broadcast("radio:#{type}", updated_collection)
    broadcast("radio:#{type}:#{id}", entity_data)
    :ok
  end

  @spec delete(entity_type(), String.t(), GenServer.server()) :: :ok
  def delete(type, id, name \\ __MODULE__)
      when type in @types and is_binary(id) and id != "" do
    updated_collection =
      Agent.get_and_update(name, fn state ->
        entities = Map.fetch!(state, type)
        updated_entities = Map.delete(entities, id)
        updated_state = Map.put(state, type, updated_entities)
        {updated_entities, updated_state}
      end)

    broadcast("radio:#{type}", updated_collection)
    broadcast("radio:#{type}:#{id}", nil)
    :ok
  end

  @spec reset(entity_type(), GenServer.server()) :: :ok
  def reset(type, name \\ __MODULE__) when type in @types do
    Agent.update(name, &Map.put(&1, type, %{}))
    broadcast("radio:#{type}", %{})
    :ok
  end

  @spec reset_all(GenServer.server()) :: :ok
  def reset_all(name \\ __MODULE__) do
    Agent.update(name, fn _ -> Map.new(@types, &{&1, %{}}) end)

    Enum.each(@types, fn type -> broadcast("radio:#{type}", %{}) end)
    :ok
  end

  defp broadcast(topic, data) do
    Phoenix.PubSub.broadcast(Skate.PubSub, topic, {:radio_updated, topic, data})
  end
end
