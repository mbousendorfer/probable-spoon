// Contexts store — single source of truth for the global contexts list.
//
// Calqued sur connectors-store.js (FIND-01 pattern). Plusieurs surfaces lisent
// les contexts (dashboard New chat dropdown, session Context tab, settings
// drawer Contexts tab) et il faut pouvoir muter (memorize → save as global,
// rename via in-session edit) avec propagation. L'array est seedé une fois
// depuis mocks.contexts ; chaque mutation notifie tous les subscribers.
//
// Public API:
//   getContexts()                → Context[]   (snapshot)
//   getContextById(id)           → Context | null
//   addContext(ctx)              → Context     (assigns id if missing, notifies)
//   updateContext(id, patch)     → Context | null   (deep-ish merge for voice/brief/brand subobjects)
//   subscribe(fn)                → unsubscribe
//
// Note: addContext is also used by the wizard memorize step when the user
// chooses "Save as global". updateContext is used by the section-edit flow
// when scope is "Update everywhere".

import { contexts as seed } from "./mocks.js?v=23";

const contexts = seed.map((c) => ({ ...c }));
const subscribers = new Set();

function freshId() {
  // Stable-enough id for the proto: "ctx-" + base36 timestamp + random suffix.
  return `ctx-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function getContexts() {
  return contexts.slice();
}

export function getContextById(id) {
  return contexts.find((c) => c.id === id) || null;
}

/**
 * Add a new global context to the store. If `id` is missing, one is generated.
 * @param {object} ctx — { id?, name, voice?, brief?, brand?, updatedAt? }
 * @returns {Context}
 */
export function addContext(ctx) {
  const next = {
    id: ctx.id || freshId(),
    name: ctx.name || "Untitled context",
    updatedAt: ctx.updatedAt || "just now",
    voice: ctx.voice || null,
    brief: ctx.brief || null,
    brand: ctx.brand || null,
  };
  contexts.push(next);
  notify();
  return next;
}

/**
 * Patch a context. Top-level fields are replaced; voice/brief/brand subobjects
 * are replaced wholesale (not deep-merged) to keep the model simple.
 * @param {string} id
 * @param {object} patch — partial { name, voice, brief, brand, updatedAt }
 * @returns {Context | null}
 */
export function updateContext(id, patch) {
  const c = contexts.find((x) => x.id === id);
  if (!c) return null;
  if (patch.name !== undefined) c.name = patch.name;
  if (patch.updatedAt !== undefined) c.updatedAt = patch.updatedAt;
  if (patch.voice !== undefined) c.voice = patch.voice;
  if (patch.brief !== undefined) c.brief = patch.brief;
  if (patch.brand !== undefined) c.brand = patch.brand;
  notify();
  return c;
}

export function subscribe(fn) {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

function notify() {
  const snapshot = getContexts();
  subscribers.forEach((fn) => {
    try {
      fn(snapshot);
    } catch (err) {
      console.warn("[contexts-store] subscriber threw", err);
    }
  });
}
