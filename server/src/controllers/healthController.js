export function getHealth(request, response) {
  response.json({
    success: true,
    message: "DreamScape API is running",
  });
}
