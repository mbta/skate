defmodule Util.Vector2d do
  @moduledoc """
  A little library for doing some very basic 2d vector math
  """

  @type t :: %__MODULE__{x: number(), y: number()}
  @enforce_keys [:x, :y]
  defstruct [:x, :y]

  @doc """
  A zero vector
  """
  @spec zero() :: __MODULE__.t()
  def zero() do
    %__MODULE__{x: 0.0, y: 0.0}
  end

  @doc """
  Take the dot product of two vectors

  ## Examples
      iex> Util.Vector2d.dot_product(
      ...>   %Util.Vector2d{x: 1.0, y: 2.0},
      ...>   %Util.Vector2d{x: 3.0, y: 4.0}
      ...> )
      11.0

      iex> Util.Vector2d.dot_product(
      ...>   %Util.Vector2d{x: 1.0, y: 1.0},
      ...>   %Util.Vector2d{x: -1.0, y: -1.0}
      ...> )
      -2.0

      iex> Util.Vector2d.dot_product(
      ...>   %Util.Vector2d{x: 1.0, y: 2.0},
      ...>   %Util.Vector2d{x: 2.0, y: -1.0}
      ...> )
      0.0
  """
  @spec dot_product(__MODULE__.t(), __MODULE__.t()) :: number()
  def dot_product(%__MODULE__{x: x1, y: y1}, %__MODULE__{x: x2, y: y2}) do
    x1 * x2 + y1 * y2
  end

  @doc """
  Scale a vector up or down

  ## Examples
      iex> Util.Vector2d.scale(
      ...>   %Util.Vector2d{x: 4.0, y: 2.0},
      ...>   2.0
      ...> )
      %Util.Vector2d{x: 8.0, y: 4.0}

      iex> Util.Vector2d.scale(
      ...>   %Util.Vector2d{x: 4.0, y: 2.0},
      ...>   0.5
      ...> )
      %Util.Vector2d{x: 2.0, y: 1.0}

      iex> Util.Vector2d.scale(
      ...>   %Util.Vector2d{x: 4.0, y: 2.0},
      ...>   -1
      ...> )
      %Util.Vector2d{x: -4.0, y: -2.0}
  """
  @spec scale(__MODULE__.t(), number()) :: __MODULE__.t()
  def scale(%__MODULE__{x: x, y: y}, factor) do
    %__MODULE__{x: x * factor, y: y * factor}
  end

  @doc """
  Project the first vector given onto the line that the second one lies on

  ## Examples
      iex> Util.Vector2d.project_onto(
      ...>   %Util.Vector2d{x: 0.5, y: 0.5},
      ...>   %Util.Vector2d{x: 1.0, y: 0.0}
      ...> )
      %Util.Vector2d{x: 0.5, y: 0.0}

      iex> Util.Vector2d.project_onto(
      ...>   %Util.Vector2d{x: 0.5, y: 0.5},
      ...>   %Util.Vector2d{x: 0.0, y: 1.0}
      ...> )
      %Util.Vector2d{x: 0.0, y: 0.5}

      iex> Util.Vector2d.project_onto(
      ...>   %Util.Vector2d{x: 1.0, y: 0.0},
      ...>   %Util.Vector2d{x: 1.0, y: 1.0}
      ...> )
      %Util.Vector2d{x: 0.5, y: 0.5}
  """
  @spec project_onto(__MODULE__.t(), __MODULE__.t()) :: __MODULE__.t()
  def project_onto(%__MODULE__{x: x, y: y}, %__MODULE__{x: onto_x, y: onto_y} = onto) do
    squared_onto_length = dot_product(onto, onto)

    scale(
      %Util.Vector2d{
        x: onto_x ** 2 * x + onto_x * onto_y * y,
        y: onto_x * onto_y * x + onto_y ** 2 * y
      },
      1 / squared_onto_length
    )
  end
end
