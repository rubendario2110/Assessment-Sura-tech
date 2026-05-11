/** Jest workers default to quiet application logs unless `APPLICATION_VERBOSE_LOGS=true`. */
if (
  process.env.JEST_WORKER_ID !== undefined &&
  process.env.APPLICATION_VERBOSE_LOGS === undefined
) {
  process.env.APPLICATION_VERBOSE_LOGS = "false";
}
