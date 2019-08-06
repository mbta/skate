import { Vehicle } from "../realtime"

const runIdToLabel = ({ runId }: Vehicle): string =>
  runId ? runId.split("-")[1] : "N/A"

export default runIdToLabel
