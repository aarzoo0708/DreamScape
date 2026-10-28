const API_BASE_URL = "http://localhost:5000/api";

function getDiagnosticPath(path) {
  return path.replace(/\/[a-f\d]{24}(?=\/|$)/gi, "/:id");
}

async function request(path, options) {
  const method = options?.method || "GET";
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...options?.headers },
      ...options,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error("DreamScape API request could not reach the server:", {
        method,
        path: getDiagnosticPath(path),
        errorName: error.name,
      });
    }
    throw new Error("Could not reach the Memories API. Check that the server is running and the frontend origin is allowed.");
  }

  const result = await response.json().catch(() => ({}));
  if (!response.ok || result.success !== true) {
    if (import.meta.env.DEV) {
      console.warn("DreamScape API request failed:", {
        method,
        path: getDiagnosticPath(path),
        status: response.status,
      });
    }
    throw new Error(result.message || `The request failed (${response.status}). Please try again.`);
  }
  return result;
}

function requireMongoId(id) {
  const memoryId = String(id ?? "");
  if (!/^[a-f\d]{24}$/i.test(memoryId)) {
    throw new Error("This memory has an invalid saved ID. Refresh the gallery and try again.");
  }
  return memoryId;
}

function requireMatchingMemory(result, requestedId, action) {
  const returnedId = result.data?._id;
  if (!returnedId || String(returnedId).toLowerCase() !== requestedId.toLowerCase()) {
    throw new Error(`The server did not confirm the ${action} for this memory. Refresh and try again.`);
  }
  return result.data;
}

export async function getMemories() {
  const result = await request("/memories");
  if (!Array.isArray(result.data)) {
    throw new Error("The Memories API returned an invalid gallery response. Please refresh and try again.");
  }
  return result.data;
}

export async function createMemory(memory) {
  const result = await request("/memories", {
    method: "POST",
    body: JSON.stringify(memory),
  });
  if (!result.data?._id) {
    throw new Error("The server did not confirm the saved memory. Please refresh and check before retrying.");
  }
  return result.data;
}

export async function updateMemory(id, memory) {
  const memoryId = requireMongoId(id);
  const result = await request(`/memories/${encodeURIComponent(memoryId)}`, {
    method: "PUT",
    body: JSON.stringify(memory),
  });
  const updatedMemory = requireMatchingMemory(result, memoryId, "update");
  return {
    ...updatedMemory,
    cleanupWarning: ["pending", "untracked"].includes(result.imageCleanupStatus)
      ? result.message
      : "",
  };
}

export function uploadMemoryPhoto(photo, onProgress = () => {}) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("POST", `${API_BASE_URL}/memories/upload`);

    request.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener("load", () => {
      let result = {};
      try {
        result = JSON.parse(request.responseText);
      } catch {
        reject(new Error("The server returned an unreadable upload response."));
        return;
      }
      if (request.status < 200 || request.status >= 300 || result.success !== true) {
        reject(new Error(result.message || "We could not upload that photo. Please try again."));
        return;
      }
      if (!result.data?.imageUrl || !result.data?.imagePublicId) {
        reject(new Error("The upload did not return a complete saved image. Please try again."));
        return;
      }
      resolve(result.data);
    });
    request.addEventListener("error", () => {
      reject(new Error("Could not reach the photo upload service. Check that the server is running."));
    });
    request.addEventListener("abort", () => reject(new Error("Photo upload was cancelled.")));

    const formData = new FormData();
    formData.append("photo", photo);
    request.send(formData);
  });
}

export async function deleteMemory(id) {
  const memoryId = requireMongoId(id);
  const result = await request(`/memories/${encodeURIComponent(memoryId)}`, { method: "DELETE" });
  requireMatchingMemory(result, memoryId, "deletion");
  return result;
}
