defmodule Concentrate.Merge.TableTest do
  @moduledoc false
  use ExUnit.Case, async: true
  use ExUnitProperties
  import Concentrate.Merge.Table
  alias Concentrate.{MockMerge, TestMergeable}

  describe "partial_update/3" do
    test "adds new items without removing existing items" do
      from = :from
      table = new()
      table = add(table, from)

      # Add initial items
      initial_items = [%TestMergeable{key: 1, value: "a"}, %TestMergeable{key: 2, value: "b"}]
      table = update(table, from, initial_items)
      assert length(items(table)) == 2

      # Partial update with a new item
      new_items = [%TestMergeable{key: 3, value: "c"}]
      table = partial_update(table, from, new_items)

      assert length(items(table)) == 3
      assert Enum.any?(items(table), fn item -> item.key == 1 end)
      assert Enum.any?(items(table), fn item -> item.key == 2 end)
      assert Enum.any?(items(table), fn item -> item.key == 3 end)
    end

    test "updates existing items with matching keys" do
      from = :from
      table = new()
      table = add(table, from)

      # Add initial items
      initial_items = [%TestMergeable{key: 1, value: "a"}, %TestMergeable{key: 2, value: "b"}]
      table = update(table, from, initial_items)

      # Partial update with an item that has a matching key
      updated_items = [%TestMergeable{key: 1, value: "updated"}]
      table = partial_update(table, from, updated_items)

      assert length(items(table)) == 2
      item_1 = Enum.find(items(table), fn item -> item.key == 1 end)
      assert item_1.value == "updated"
    end
  end

  describe "items/2" do
    property "with one source, returns the data" do
      check all(mergeables <- TestMergeable.mergeables()) do
        from = :from
        table = new()
        table = add(table, from)
        table = update(table, from, mergeables)
        assert Enum.sort(items(table)) == Enum.sort(MockMerge.merge(mergeables))
      end
    end

    property "with multiple sources, returns the merged data" do
      check all(multi_source_mergeables <- sourced_mergeables()) do
        # reverse so we get the latest data
        # get the uniq sources
        expected =
          multi_source_mergeables
          |> Enum.reverse()
          |> Enum.uniq_by(&elem(&1, 0))
          |> Enum.flat_map(&elem(&1, 1))
          |> MockMerge.merge()

        table =
          Enum.reduce(multi_source_mergeables, new(), fn {source, mergeables}, table ->
            table
            |> add(source)
            |> update(source, mergeables)
          end)

        actual = items(table)

        assert Enum.sort(actual) == Enum.sort(expected)
      end
    end

    property "updating a source returns the latest data for that source" do
      check all(all_mergeables <- list_of_mergeables()) do
        from = :from
        table = new()
        table = add(table, from)
        expected = List.last(all_mergeables)

        table =
          Enum.reduce(all_mergeables, table, fn mergeables, table ->
            update(table, from, mergeables)
          end)

        assert Enum.sort(items(table)) == Enum.sort(expected)
      end
    end
  end

  defp sourced_mergeables do
    list_of(
      {StreamData.atom(:alphanumeric), TestMergeable.mergeables()},
      min_length: 1,
      max_length: 3
    )
  end

  defp list_of_mergeables do
    list_of(TestMergeable.mergeables(), min_length: 1, max_length: 3)
  end
end
