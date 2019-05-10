defmodule Concentrate.Parser.Helpers do
  @moduledoc """
  Helper functions for the GTFS-RT and GTFS-RT Enhanced parsers.
  """

  defmodule Options do
    @moduledoc false
    @type drop_fields :: %{module => map}
    @type t :: %Options{
            routes: :all | {:ok, MapSet.t()},
            excluded_routes: :none | {:ok, MapSet.t()},
            max_time: :infinity | non_neg_integer,
            drop_fields: drop_fields
          }
    defstruct routes: :all, excluded_routes: :none, max_time: :infinity, drop_fields: %{}
  end

  alias __MODULE__.Options

  @doc """
  Options for parsing a GTFS Realtime file.

  * routes: either :all (don't filter the routes) or {:ok, Enumerable.t} with the route IDs to include
  * excluded_routes: either :none (don't filter) or {:ok, Enumerable.t} with the route IDs to exclude
  * max_time: the maximum time in the future for a stop time update
  * drop_fields: an optional map of struct module to Enumerable.t with fields to drop from the struct
  """
  def parse_options(opts) do
    parse_options(opts, %Options{})
  end

  defp parse_options([{:routes, route_ids} | rest], acc) do
    parse_options(rest, %{acc | routes: {:ok, MapSet.new(route_ids)}})
  end

  defp parse_options([{:excluded_routes, route_ids} | rest], acc) do
    parse_options(rest, %{acc | excluded_routes: {:ok, MapSet.new(route_ids)}})
  end

  defp parse_options([{:drop_fields, %{} = fields} | rest], acc) do
    # create a partial map with the default values from the struct
    fields =
      for {mod, fields} <- fields, into: %{} do
        new_map = Map.take(struct!(mod), fields)
        {mod, new_map}
      end

    parse_options(rest, %{acc | drop_fields: fields})
  end

  defp parse_options([{:max_future_time, seconds} | rest], acc) do
    max_time = :os.system_time(:seconds) + seconds
    parse_options(rest, %{acc | max_time: max_time})
  end

  defp parse_options([_ | rest], acc) do
    parse_options(rest, acc)
  end

  defp parse_options([], acc) do
    acc
  end

  @spec drop_fields(Enumerable.t(), Options.drop_fields()) :: Enumerable.t()
  @doc """
  Given a configuration map, optionally drop some fields from the given enumerable.

  If non-structs are a part of the enumerable, they will be removed.
  """
  def drop_fields(enum, map) when map_size(map) == 0 do
    enum
  end

  def drop_fields(enum, map) do
    for %{__struct__: mod} = struct <- enum do
      case map do
        %{^mod => new_map} ->
          Map.merge(struct, new_map)

        _ ->
          struct
      end
    end
  end
end
