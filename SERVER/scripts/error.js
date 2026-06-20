const errorhandler = async (error, response) => {
  console.error(error)
  response.message = typeof error === "string" ? error : error.message || "Internal Server Error"
  return response
}

module.exports = errorhandler
