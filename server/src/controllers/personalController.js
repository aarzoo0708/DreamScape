import mongoose from "mongoose";
import JournalEntry from "../models/JournalEntry.js";
import FutureLetter from "../models/FutureLetter.js";
import DreamGoal from "../models/DreamGoal.js";
import GratitudeEntry from "../models/GratitudeEntry.js";
import PersonalSettings from "../models/PersonalSettings.js";

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function bodyObject(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new RequestError(400, "A JSON object is required.");
  }
  return body;
}

function getId(id) {
  if (!mongoose.isObjectIdOrHexString(id)) throw new RequestError(400, "Invalid entry ID.");
  return id;
}

function addText(input, body, field, { partial = false, required = false, max = 5000 } = {}) {
  if (partial && !Object.hasOwn(body, field)) return;
  if (!Object.hasOwn(body, field) && !required) return;
  const value = body[field];
  if (typeof value !== "string" || (required && !value.trim())) {
    throw new RequestError(400, `${field} must be a non-empty string.`);
  }
  if (value.length > max) throw new RequestError(400, `${field} must be ${max} characters or fewer.`);
  input[field] = value.trim();
}

function addDate(input, body, field, { partial = false, required = false } = {}) {
  if (partial && !Object.hasOwn(body, field)) return;
  const value = body[field];
  if ((value === undefined || value === null || value === "") && !required) {
    input[field] = null;
    return;
  }
  const date = new Date(value);
  if (!value || Number.isNaN(date.getTime())) throw new RequestError(400, `${field} must be a valid date.`);
  input[field] = date;
}

function addBoolean(input, body, field, { partial = false } = {}) {
  if (partial && !Object.hasOwn(body, field)) return;
  if (typeof body[field] !== "boolean") throw new RequestError(400, `${field} must be a boolean.`);
  input[field] = body[field];
}

function validateJournal(body, partial = false) {
  bodyObject(body);
  const input = {};
  addText(input, body, "title", { partial, required: true, max: 120 });
  addText(input, body, "content", { partial, required: true, max: 20000 });
  addText(input, body, "mood", { partial, max: 60 });
  addDate(input, body, "date", { partial, required: true });
  return input;
}

function validateLetter(body, partial = false) {
  bodyObject(body);
  const input = {};
  addText(input, body, "title", { partial, required: true, max: 120 });
  addText(input, body, "content", { partial, required: true, max: 30000 });
  addDate(input, body, "unlockAt", { partial });
  return input;
}

function validateGoal(body, partial = false) {
  bodyObject(body);
  const input = {};
  addText(input, body, "title", { partial, required: true, max: 140 });
  addText(input, body, "description", { partial, max: 4000 });
  addDate(input, body, "targetDate", { partial });
  if (!partial || Object.hasOwn(body, "progress")) {
    const progress = body.progress ?? 0;
    if (typeof progress !== "number" || !Number.isFinite(progress) || progress < 0 || progress > 100) {
      throw new RequestError(400, "progress must be a number from 0 to 100.");
    }
    input.progress = progress;
  }
  if (Object.hasOwn(body, "completed")) addBoolean(input, body, "completed", { partial: true });
  else if (!partial) input.completed = false;
  if (Object.hasOwn(body, "archived")) addBoolean(input, body, "archived", { partial: true });
  else if (!partial) input.archived = false;
  if (input.completed) input.progress = 100;
  if (input.progress === 100) input.completed = true;
  return input;
}

function validateGratitude(body, partial = false) {
  bodyObject(body);
  const input = {};
  addText(input, body, "title", { partial, max: 120 });
  addText(input, body, "content", { partial, required: true, max: 5000 });
  addDate(input, body, "date", { partial, required: true });
  if (!partial || Object.hasOwn(body, "kind")) {
    const kind = body.kind ?? "gratitude";
    if (!["gratitude", "win"].includes(kind)) throw new RequestError(400, "kind must be gratitude or win.");
    input.kind = kind;
  }
  return input;
}

function serializeLetter(letter) {
  const result = letter.toObject ? letter.toObject() : { ...letter };
  const locked = Boolean(result.unlockAt && new Date(result.unlockAt).getTime() > Date.now());
  if (locked) result.content = null;
  return { ...result, locked };
}

function createCrudHandlers(Model, validate, { sort = { createdAt: -1 }, serialize = (entry) => entry } = {}) {
  return {
    list: async (request, response, next) => {
      try {
        const entries = await Model.find().sort(sort);
        return response.json({ success: true, data: entries.map(serialize) });
      } catch (error) {
        return next(error);
      }
    },
    get: async (request, response, next) => {
      try {
        const entry = await Model.findById(getId(request.params.id));
        if (!entry) return response.status(404).json({ success: false, message: "Entry not found." });
        return response.json({ success: true, data: serialize(entry) });
      } catch (error) {
        return sendError(error, response, next);
      }
    },
    create: async (request, response, next) => {
      try {
        const entry = await Model.create(validate(request.body));
        return response.status(201).json({ success: true, message: "Entry saved.", data: serialize(entry) });
      } catch (error) {
        return sendError(error, response, next);
      }
    },
    update: async (request, response, next) => {
      try {
        const input = validate(request.body, true);
        if (Object.keys(input).length === 0) throw new RequestError(400, "Provide at least one field to update.");
        const entry = await Model.findByIdAndUpdate(
          getId(request.params.id),
          input,
          { returnDocument: "after", runValidators: true },
        );
        if (!entry) return response.status(404).json({ success: false, message: "Entry not found." });
        return response.json({ success: true, message: "Entry updated.", data: serialize(entry) });
      } catch (error) {
        return sendError(error, response, next);
      }
    },
    remove: async (request, response, next) => {
      try {
        const entry = await Model.findByIdAndDelete(getId(request.params.id));
        if (!entry) return response.status(404).json({ success: false, message: "Entry not found." });
        return response.json({ success: true, message: "Entry deleted.", data: { _id: entry._id } });
      } catch (error) {
        return sendError(error, response, next);
      }
    },
  };
}

function sendError(error, response, next) {
  if (error instanceof RequestError) {
    return response.status(error.status).json({ success: false, message: error.message });
  }
  return next(error);
}

const journalHandlers = createCrudHandlers(JournalEntry, validateJournal, { sort: { date: -1, createdAt: -1 } });
const letterHandlers = createCrudHandlers(FutureLetter, validateLetter, { sort: { createdAt: -1 }, serialize: serializeLetter });
const goalHandlers = createCrudHandlers(DreamGoal, validateGoal, { sort: { updatedAt: -1 } });
const gratitudeHandlers = createCrudHandlers(GratitudeEntry, validateGratitude, { sort: { date: -1, createdAt: -1 } });

export const listJournalEntries = journalHandlers.list;
export const getJournalEntry = journalHandlers.get;
export const createJournalEntry = journalHandlers.create;
export const updateJournalEntry = journalHandlers.update;
export const deleteJournalEntry = journalHandlers.remove;

export const listFutureLetters = letterHandlers.list;
export const getFutureLetter = letterHandlers.get;
export const createFutureLetter = letterHandlers.create;
export const deleteFutureLetter = letterHandlers.remove;

export const listDreamGoals = goalHandlers.list;
export const getDreamGoal = goalHandlers.get;
export const createDreamGoal = goalHandlers.create;
export const updateDreamGoal = goalHandlers.update;
export const deleteDreamGoal = goalHandlers.remove;

export const listGratitudeEntries = gratitudeHandlers.list;
export const getGratitudeEntry = gratitudeHandlers.get;
export const createGratitudeEntry = gratitudeHandlers.create;
export const updateGratitudeEntry = gratitudeHandlers.update;
export const deleteGratitudeEntry = gratitudeHandlers.remove;

export async function updateFutureLetter(request, response, next) {
  try {
    const id = getId(request.params.id);
    const body = bodyObject(request.body);
    const existing = await FutureLetter.findById(id);
    if (!existing) return response.status(404).json({ success: false, message: "Letter not found." });
    const locked = existing.unlockAt && existing.unlockAt.getTime() > Date.now();
    if (locked && Object.hasOwn(body, "content")) {
      return response.status(423).json({ success: false, message: "This letter is still locked. Its contents cannot be changed yet." });
    }
    const input = validateLetter(body, true);
    if (Object.keys(input).length === 0) throw new RequestError(400, "Provide at least one field to update.");
    const letter = await FutureLetter.findByIdAndUpdate(
      id,
      input,
      { returnDocument: "after", runValidators: true },
    );
    return response.json({ success: true, message: "Letter updated.", data: serializeLetter(letter) });
  } catch (error) {
    return sendError(error, response, next);
  }
}

const SETTINGS_ID = "personal-settings";
const allowedSettings = new Set([
  "displayName", "introduction", "favouriteQuote", "theme", "customAlbums",
  "dashboardShowQuote", "dashboardShowOnThisDay",
]);

function validateSettings(body) {
  bodyObject(body);
  const input = {};
  for (const [field, max] of [["displayName", 80], ["introduction", 500], ["favouriteQuote", 500]]) {
    if (Object.hasOwn(body, field)) addText(input, body, field, { max });
  }
  if (Object.hasOwn(body, "theme")) {
    if (!["midnight", "rose", "lavender"].includes(body.theme)) throw new RequestError(400, "Choose a supported theme.");
    input.theme = body.theme;
  }
  if (Object.hasOwn(body, "customAlbums")) {
    if (!Array.isArray(body.customAlbums) || body.customAlbums.length > 30 || body.customAlbums.some((album) => typeof album !== "string" || album.length > 80)) {
      throw new RequestError(400, "customAlbums must be a list of up to 30 names, each 80 characters or fewer.");
    }
    input.customAlbums = [...new Map(body.customAlbums.map((album) => album.trim()).filter(Boolean).map((album) => [album.toLocaleLowerCase(), album])).values()];
  }
  for (const field of ["dashboardShowQuote", "dashboardShowOnThisDay"]) {
    if (Object.hasOwn(body, field)) addBoolean(input, body, field);
  }
  const unsupported = Object.keys(body).filter((field) => !allowedSettings.has(field));
  if (unsupported.length) throw new RequestError(400, "One or more settings fields are not supported.");
  if (Object.keys(input).length === 0) throw new RequestError(400, "Provide at least one setting to update.");
  return input;
}

export async function getPersonalSettings(request, response, next) {
  try {
    const settings = await PersonalSettings.findByIdAndUpdate(
      SETTINGS_ID,
      { $setOnInsert: { _id: SETTINGS_ID } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    return response.json({ success: true, data: settings });
  } catch (error) {
    return next(error);
  }
}

export async function updatePersonalSettings(request, response, next) {
  try {
    const settings = await PersonalSettings.findByIdAndUpdate(
      SETTINGS_ID,
      { $set: validateSettings(request.body) },
      { upsert: true, returnDocument: "after", runValidators: true, setDefaultsOnInsert: true },
    );
    return response.json({ success: true, message: "Your settings were saved.", data: settings });
  } catch (error) {
    return sendError(error, response, next);
  }
}
