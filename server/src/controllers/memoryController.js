import mongoose from "mongoose";
import Memory from "../models/Memory.js";

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function getMemoryId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) {
    throw new RequestError(400, "Invalid memory ID.");
  }

  return id;
}

function getMemoryInput(body, { partial = false } = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError(400, "A JSON object is required.");
  }

  const input = {};

  if (!partial || Object.hasOwn(body, "title")) {
    if (typeof body.title !== "string" || !body.title.trim()) {
      throw new RequestError(400, "A non-empty title is required.");
    }
    input.title = body.title.trim();
  }

  for (const field of ["description", "imageUrl", "mood"]) {
    if (Object.hasOwn(body, field)) {
      if (typeof body[field] !== "string") {
        throw new RequestError(400, `${field} must be a string.`);
      }
      input[field] = body[field].trim();
    }
  }

  if (Object.hasOwn(body, "date")) {
    if (body.date === null || body.date === "") {
      input.date = null;
    } else {
      const date = new Date(body.date);
      if (Number.isNaN(date.getTime())) {
        throw new RequestError(400, "date must be a valid date.");
      }
      input.date = date;
    }
  }

  if (partial && Object.keys(input).length === 0) {
    throw new RequestError(400, "Provide at least one valid memory field to update.");
  }

  return input;
}

function handleError(error, response, next) {
  if (error instanceof RequestError) {
    return response.status(error.status).json({ success: false, message: error.message });
  }
  return next(error);
}

export async function listMemories(request, response, next) {
  try {
    const memories = await Memory.find().sort({ createdAt: -1 });
    response.json({ success: true, data: memories });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function getMemory(request, response, next) {
  try {
    const memory = await Memory.findById(getMemoryId(request.params.id));
    if (!memory) {
      return response.status(404).json({ success: false, message: "Memory not found." });
    }
    return response.json({ success: true, data: memory });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function createMemory(request, response, next) {
  try {
    const memory = await Memory.create(getMemoryInput(request.body));
    return response.status(201).json({
      success: true,
      message: "Memory created.",
      data: memory,
    });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function updateMemory(request, response, next) {
  try {
    const memory = await Memory.findByIdAndUpdate(
      getMemoryId(request.params.id),
      getMemoryInput(request.body, { partial: true }),
      { new: true, runValidators: true },
    );
    if (!memory) {
      return response.status(404).json({ success: false, message: "Memory not found." });
    }
    return response.json({ success: true, message: "Memory updated.", data: memory });
  } catch (error) {
    return handleError(error, response, next);
  }
}

export async function deleteMemory(request, response, next) {
  try {
    const memory = await Memory.findByIdAndDelete(getMemoryId(request.params.id));
    if (!memory) {
      return response.status(404).json({ success: false, message: "Memory not found." });
    }
    return response.json({ success: true, message: "Memory deleted.", data: memory });
  } catch (error) {
    return handleError(error, response, next);
  }
}
