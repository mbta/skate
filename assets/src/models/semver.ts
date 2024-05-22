interface SemVer extends SemVerVersion, SemVerLabels {}
interface SemVerVersion {
  major: number
  minor: number
  patch: number
}
interface SemVerLabels {
  "pre-release labels": []
  "build metadata labels": []
}
export const semver = (
  major: number,
  minor: number,
  patch: number,
  labels: Partial<SemVerLabels> = {}
) =>
  ({
    major,
    minor,
    patch,

    "build metadata labels": [],
    "pre-release labels": [],

    ...labels,
  } satisfies SemVer)
