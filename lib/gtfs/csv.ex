defmodule Gtfs.Csv do
  @moduledoc """
  Manage parsing data from GTFS CSV files.
  """

  @type row :: %{required(String.t()) => String.t()}

  @doc """
  Takes binary csv data, a function to filter each row, and a function to parse each row, and returns the list of results.
  The rows will be passed to the parser as maps with string keys and values.
  e.g. %{"col1" => "1", "col2" => "x"}

  iex> Gtfs.Csv.parse("col1,col2\\n1,x\\n2,y\\n3,z", fn row -> row["col2"] != "y" end, fn row -> String.to_integer(row["col1"]) end)
  [1, 3]
  """
  @spec parse(
          binary() | nil,
          [(row -> boolean)] | (row -> boolean),
          (row -> row_struct)
        ) ::
          [row_struct]
        when row_struct: var
  def parse(file_binary, row_filters, row_decoder \\ & &1)

  def parse(nil, _row_filters, _row_decoder) do
    []
  end

  def parse(file_binary, row_filter, row_decoder) when not is_list(row_filter),
    do: parse(file_binary, [row_filter], row_decoder)

  def parse(file_binary, row_filters, row_decoder) do
    file_binary
    |> String.split("\n")
    |> Enum.reject(&(&1 == ""))
    |> CSV.decode(headers: true)
    |> Stream.flat_map(fn {:ok, csv_row} ->
      if Enum.all?(row_filters, fn row_filter -> row_filter.(csv_row) end) do
        [row_decoder.(csv_row)]
      else
        []
      end
    end)
    |> Enum.to_list()
  end
end
