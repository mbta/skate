defmodule Schedule.Csv do
  @moduledoc """
  Manage parsing data from GTFS CSV files.
  """

  @type row :: %{required(String.t()) => String.t()}
  @type format :: :gtfs | :hastus
  @type option(row_struct) ::
          {:format, format()}
          | {:filter, (row() -> boolean())}
          | {:parse, (row() -> row_struct)}
  @type options(row_struct) :: [option(row_struct)]

  @doc """
  Takes binary csv data
  Optionally takes a function to filter which rows to include in the result.
  Optionally takes a function to parse each row
  Returns a list of results

  More than one filter is allowed

  The rows will be passed to the parser as maps with string keys and values.
  e.g. %{"col1" => "1", "col2" => "x"}

  iex> Schedule.Csv.parse("col1,col2\\n1,x\\n2,y")
  [%{"col1" => "1", "col2" => "x"}, %{"col1" => "2", "col2" => "y"}]

  iex> Schedule.Csv.parse("col1,col2\\n1,x\\n2,y\\n3,z",
  ...>   filter: fn row -> row["col2"] != "y" end,
  ...>   parse: fn row -> String.to_integer(row["col1"]) end
  ...> )
  [1, 3]
  """
  @spec parse(binary() | nil) :: [row()]
  @spec parse(binary() | nil, options(row_struct)) :: [row_struct] when row_struct: var
  def parse(file_binary, options \\ [])

  def parse(nil, _options) do
    []
  end

  def parse(file_binary, options) do
    format = Keyword.get(options, :format, :gtfs)
    filters = Keyword.get_values(options, :filter)
    parser = Keyword.get(options, :parse, & &1)

    [file_binary]
    |> CSV.decode!(format_opts(format))
    |> Stream.flat_map(fn csv_row ->
      if Enum.all?(filters, fn filter -> filter.(csv_row) end) do
        [parser.(csv_row)]
      else
        []
      end
    end)
    |> Enum.to_list()
  end

  @spec format_opts(format()) :: Keyword.t()
  defp format_opts(:gtfs), do: [headers: true]
  defp format_opts(:hastus), do: [headers: true, separator: ?;, field_transform: &String.trim/1]
end
