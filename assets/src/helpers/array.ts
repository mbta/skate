export function partition<T, U extends T>(
  items: T[],
  predicate: (value: T) => value is U
): [U[], Exclude<T, U>[]]
export function partition<T>(
  items: T[],
  predicate: (value: T) => boolean
): [T[], T[]]
export function partition<T>(
  items: T[],
  predicate: (value: T) => boolean
): [T[], T[]] {
  return items.reduce(
    ([pass, fail], item) => {
      return predicate(item) ? [[...pass, item], fail] : [pass, [...fail, item]]
    },
    [[] as T[], [] as T[]]
  )
}

export const uniq = <T>(array: T[]): T[] => Array.from(new Set(array)).sort()

export const uniqBy = <T, U>(array: T[], fun: (value: T) => U): T[] => {
  const [newArray] = array.reduce(
    ([acc, seen], value) => {
      const funValue = fun(value)

      if (seen.has(funValue)) {
        return [acc, seen]
      } else {
        return [acc.concat(value), seen.add(funValue)]
      }
    },
    [[] as T[], new Set() as Set<U>]
  )

  return newArray
}

export const flatten = <T>(array: T[][]): T[] =>
  array.reduce((previous, current) => previous.concat(current), [])

export const intersperseString = (s: string, delimiter: string): string => {
  let result = ""
  for (const char of s) {
    if (result !== "") {
      result += delimiter
    }
    result += char
  }
  return result
}

export const equalByElements = <T>(
  array1: T[],
  array2: T[],
  fun?: (v1: T, v2: T) => boolean
): boolean => {
  if (array1.length === array2.length) {
    if (fun) {
      return array1.every((element, index) => fun(array2[index], element))
    } else {
      return array1.every((element, index) => array2[index] === element)
    }
  } else {
    return false
  }
}
