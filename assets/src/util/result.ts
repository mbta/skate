/**
 * The discriminator value used to determine if a {@linkcode Result<T, E>} is
 * {@linkcode Ok<T>} or {@linkcode Err<E>}.
 */
enum ResultTag {
  Ok,
  Err,
}

/**
 * The key of the {@linkcode Result<T, E>} discriminator value.
 *
 * This is not exported so that usages of the objects cannot be
 * accessed or modified manually outside of this module.
 */
const tag = Symbol("result-enum-tag")

/** The {@linkcode Ok<T>} variant of {@linkcode Result<T, E>} */
export type Ok<T> = { [tag]: ResultTag.Ok; ok: T }

/** The {@linkcode Err<E>} variant of {@linkcode Result<T, E>} */
export type Err<E> = { [tag]: ResultTag.Err; err: E }

/**
 * Type which may contain an {@linkcode Ok<T>} state, or a {@linkcode Err<E>} state
 *
 * useful for requiring a caller of a function to handle the Error state of a return value.
 */
export type Result<T, E> = Ok<T> | Err<E>

/** Determines if a {@linkcode Result<T, E>} is a {@linkcode Ok<T>} */
export const isOk = <T, E>(r: Result<T, E>): r is Ok<T> =>
  tag in r && r[tag] === ResultTag.Ok

/** Determines if a {@linkcode Result<T, E>} is a {@linkcode Err<E>} */
export const isErr = <T, E>(r: Result<T, E>): r is Err<E> =>
  tag in r && r[tag] === ResultTag.Err

/** Constructs a {@linkcode Ok<T>} with {@linkcode v} as the value */
export const Ok = <T>(v: T): Ok<T> => ({
  [tag]: ResultTag.Ok,
  ok: v,
})

/** Constructs a {@linkcode Err<E>} with {@linkcode v} as the value */
export const Err = <E>(v: E): Err<E> => ({
  [tag]: ResultTag.Err,
  err: v,
})

/**
 * If {@linkcode r} is {@linkcode Ok<T>}, it applies {@linkcode fn} to
 * the value contained in {@linkcode r}. Otherwise returns {@linkcode r}.
 */
export const map = <T, U, E>(r: Result<T, E>, fn: (v: T) => U): Result<U, E> =>
  isOk(r) ? Ok(fn(r.ok)) : r
