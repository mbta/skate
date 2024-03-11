export interface Loading {
  is_loading: true
}

export interface Ok<T> {
  ok: T
}

interface FetchError {
  is_error: true
}

export type FetchResult<T> = Loading | Ok<T> | (Ok<T> & Loading) | FetchError

export const isLoading = <T>(r: FetchResult<T>): r is Loading =>
  "is_loading" in r && r.is_loading === true

export const isOk = <T>(r: FetchResult<T>): r is Ok<T> => "ok" in r

export const isFetchError = <T>(r: FetchResult<T>): r is FetchError =>
  "is_error" in r && r.is_error === true

export const loading = <T>(): FetchResult<T> => ({ is_loading: true })

export const ok = <T>(r: T): FetchResult<T> => ({ ok: r })

export const fetchError = <T>(): FetchResult<T> => ({ is_error: true })
