defmodule Concentrate.StructHelpers do
  @moduledoc false

  @doc """
  Builds accessors for each struct field.

  ## Example

      defmodule Test do
        defstruct_accessors([:one, :two])
      end

      iex> Test.one(Test.new(one: 1))
      1
  """
  defmacro defstruct_accessors(fields) do
    [
      define_struct(fields),
      define_new(),
      define_update()
    ] ++
      for field <- fields do
        [
          define_accessor(field),
          define_field_update(field)
        ]
      end
  end

  @doc false
  def define_struct(fields) do
    quote do
      defstruct unquote(fields)
      @opaque t :: %__MODULE__{}
    end
  end

  @doc false
  def define_new do
    quote do
      @compile [inline: [new: 1]]
      @spec new(Keyword.t()) :: t
      def new(opts) when is_list(opts) do
        struct!(__MODULE__, opts)
      end

      defoverridable new: 1
    end
  end

  @doc false
  def define_update do
    quote do
      @compile [inline: [update: 2]]
      @spec update(%__MODULE__{} | t, Enumerable.t()) :: t
      def update(%__MODULE__{} = existing, %{} = opts) do
        Map.merge(existing, opts)
      end

      def update(%__MODULE__{} = existing, opts) do
        update(existing, Map.new(opts))
      end
    end
  end

  @doc false
  def define_field_update({field, _default}) do
    define_field_update(field)
  end

  # sobelow_skip ["DOS.BinToAtom"]
  def define_field_update(field) do
    name = :"update_#{field}"

    quote do
      @compile [inline: [{unquote(name), 2}]]
      @spec unquote(name)(%__MODULE__{} | t, any) :: t
      def unquote(name)(%__MODULE__{} = struct, new_value) do
        %{struct | unquote(field) => new_value}
      end
    end
  end

  @doc false
  def define_accessor({field, _default}) do
    define_accessor(field)
  end

  def define_accessor(field) do
    quote do
      @compile [inline: [{unquote(field), 1}]]
      @spec unquote(field)(%__MODULE__{} | t) :: any
      def unquote(field)(%__MODULE__{unquote(field) => value}), do: value
    end
  end
end
