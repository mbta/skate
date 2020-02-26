module.exports = async () => {
  // Run jest in the UTC timezone
  process.env.TZ = "UTC"
}
