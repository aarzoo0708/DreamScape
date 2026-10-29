import { apiRequest } from "./memories.js";

const entryRoutes = new Set(["journal", "letters", "goals", "gratitude"]);

function requireId(id) {
  const entryId = String(id ?? "");
  if (!/^[a-f\d]{24}$/i.test(entryId)) throw new Error("This saved entry has an invalid ID. Refresh and try again.");
  return encodeURIComponent(entryId);
}

export async function getPersonalSettings() {
  const result = await apiRequest("/personal/settings");
  if (!result.data) throw new Error("Personal settings could not be loaded.");
  return result.data;
}

export async function savePersonalSettings(settings) {
  const result = await apiRequest("/personal/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
  return result.data;
}

export async function listPersonalEntries(type) {
  if (!entryRoutes.has(type)) throw new Error("Unknown journal section.");
  const result = await apiRequest(`/personal/${type}`);
  if (!Array.isArray(result.data)) throw new Error("Saved entries could not be loaded.");
  return result.data;
}

export async function createPersonalEntry(type, entry) {
  if (!entryRoutes.has(type)) throw new Error("Unknown journal section.");
  const result = await apiRequest(`/personal/${type}`, {
    method: "POST",
    body: JSON.stringify(entry),
  });
  if (!result.data?._id) throw new Error("The server did not confirm this saved entry.");
  return result.data;
}

export async function updatePersonalEntry(type, id, entry) {
  if (!entryRoutes.has(type)) throw new Error("Unknown journal section.");
  const entryId = requireId(id);
  const result = await apiRequest(`/personal/${type}/${entryId}`, {
    method: "PUT",
    body: JSON.stringify(entry),
  });
  if (!result.data?._id || result.data._id !== id) {
    throw new Error("The server did not confirm this update. Refresh and try again.");
  }
  return result.data;
}

export async function deletePersonalEntry(type, id) {
  if (!entryRoutes.has(type)) throw new Error("Unknown journal section.");
  const entryId = requireId(id);
  const result = await apiRequest(`/personal/${type}/${entryId}`, { method: "DELETE" });
  if (!result.success || result.data?._id !== id) {
    throw new Error("The server did not confirm this deletion. Refresh and try again.");
  }
  return result;
}
