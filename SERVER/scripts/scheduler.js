const ontime = require("ontime").default
const Show = require("../models/show")

const startScheduler = () => {
  console.log("[Scheduler] Initializing midnight show cleanup...")

  ontime(
    {
      cycle: "00:00:00",
    },
    async (ot) => {
      try {
        console.log("[Scheduler] Running daily cleanup of past shows...")
        const now = new Date()
        const result = await Show.deleteMany({ showTime: { $lt: now } })
        console.log(`[Scheduler] Cleaned up ${result.deletedCount} past shows.`)
      } catch (err) {
        console.error("[Scheduler] Error cleaning up past shows:", err)
      } finally {
        ot.done()
      }
    },
  )
}

module.exports = { startScheduler }
