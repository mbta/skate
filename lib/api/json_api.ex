defmodule JsonApi.Item do
  @moduledoc false

  defstruct [:type, :id, :attributes, :relationships]

  @type t :: %JsonApi.Item{
          type: String.t(),
          id: String.t(),
          attributes: %{String.t() => any},
          relationships: %{String.t() => list(JsonApi.Item.t())}
        }
end

defmodule JsonApi.Error do
  @moduledoc false

  defstruct [:code, :source, :detail, :meta]

  @type t :: %__MODULE__{
          code: String.t() | nil,
          source: String.t() | nil,
          detail: String.t() | nil,
          meta: %{String.t() => any}
        }
end

defmodule JsonApi do
  @moduledoc false

  defstruct data: []
  @type t :: %JsonApi{data: list(JsonApi.Item.t())}

  @spec empty() :: JsonApi.t()
  def empty do
    %JsonApi{
      data: []
    }
  end

  @spec merge(JsonApi.t(), JsonApi.t()) :: JsonApi.t()
  def merge(j1, j2) do
    %JsonApi{
      data: j1.data ++ j2.data
    }
  end

  @spec parse(String.t()) :: JsonApi.t() | {:error, any}
  def parse(body) do
    with {:ok, parsed} <- Jason.decode(body),
         {:ok, data} <- parse_data(parsed) do
      %JsonApi{
        data: data
      }
    else
      {:error, [_ | _] = errors} ->
        {:error, parse_errors(errors)}

      error ->
        error
    end
  end

  @spec parse_data(term()) :: {:ok, [JsonApi.Item.t()]} | {:error, any}
  defp parse_data(%{"data" => data} = parsed) when is_list(data) do
    included = parse_included(parsed)
    {:ok, Enum.map(data, &parse_data_item(&1, included))}
  end

  defp parse_data(%{"data" => data} = parsed) do
    included = parse_included(parsed)
    {:ok, [parse_data_item(data, included)]}
  end

  defp parse_data(%{"errors" => errors}) do
    {:error, errors}
  end

  defp parse_data(data) when is_list(data) do
    # V3Api.Stream receives :reset data as a list of items
    parse_data(%{"data" => data})
  end

  defp parse_data(%{"id" => _} = data) do
    # V3Api.Stream receives :add, :update, and :remove data as single items
    parse_data(%{"data" => data})
  end

  defp parse_data(%{}) do
    {:error, :invalid}
  end

  @spec parse_data_item(map(), map()) :: JsonApi.Item.t()
  defp parse_data_item(%{"type" => type, "id" => id, "attributes" => attributes} = item, included) do
    %JsonApi.Item{
      type: type,
      id: id,
      attributes: attributes,
      relationships: load_relationships(item["relationships"], included)
    }
  end

  defp parse_data_item(%{"type" => type, "id" => id}, _) do
    %JsonApi.Item{
      type: type,
      id: id
    }
  end

  @spec load_relationships(map() | nil, map()) :: map()
  defp load_relationships(nil, _) do
    %{}
  end

  defp load_relationships(%{} = relationships, included) do
    Helpers.map_values(relationships, &load_single_relationship(&1, included))
  end

  @spec load_single_relationship(any, map()) :: list()
  defp load_single_relationship(relationship, _) when relationship == %{} do
    []
  end

  defp load_single_relationship(%{"data" => data}, included) when is_list(data) do
    data
    |> Enum.map(&match_included(&1, included))
    |> Enum.reject(&is_nil/1)
    |> Enum.map(&parse_data_item(&1, included))
  end

  defp load_single_relationship(%{"data" => %{} = data}, included) do
    case match_included(data, included) do
      nil -> []
      item -> [parse_data_item(item, included)]
    end
  end

  defp load_single_relationship(_, _) do
    []
  end

  @spec match_included(map() | nil, map()) :: any()
  defp match_included(nil, _) do
    nil
  end

  defp match_included(%{"type" => type, "id" => id} = item, included) do
    Map.get(included, {type, id}, item)
  end

  @spec parse_included(term()) :: map()
  defp parse_included(params) do
    included = Map.get(params, "included", [])

    data =
      case Map.get(params, "data") do
        nil -> []
        list when is_list(list) -> list
        item -> [item]
      end

    data = Enum.map(data, fn item -> Map.delete(item, "relationships") end)

    included
    |> Enum.concat(data)
    |> Map.new(fn %{"type" => type, "id" => id} = item ->
      {{type, id}, item}
    end)
  end

  @spec parse_errors(list()) :: [JsonApi.Error.t()]
  defp parse_errors(errors) do
    Enum.map(errors, &parse_error/1)
  end

  @spec parse_error(any()) :: JsonApi.Error.t()
  defp parse_error(error) do
    %JsonApi.Error{
      code: error["code"],
      detail: error["detail"],
      source: error["source"],
      meta: error["meta"] || %{}
    }
  end
end
