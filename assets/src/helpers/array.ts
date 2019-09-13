export function partition<T>(items: T[], testFn: (value: T) => boolean): T[][] {
  return items.reduce(
    ([pass, fail], item) => {
      return testFn(item) ? [[...pass, item], fail] : [pass, [...fail, item]]
    },
    [[] as T[], [] as T[]]
  )
}

export const uniq = <T>(array: T[]): T[] => Array.from(new Set(array)).sort()
