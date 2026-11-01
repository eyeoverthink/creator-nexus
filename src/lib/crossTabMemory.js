import { useEffect, useState, useCallback } from 'react';

const STORAGE_KEY = 'nexus_cross_tab_memory_v1';
const CHANNEL_NAME = 'creator_nexus_synapse_v1';
const WINDOW_ID_KEY = 'nexus_synapse_window_id';

const ROUTE_LABELS = {
  '/': 'Home Dashboard',
  '/studio': 'Creative Studio',
  '/knowledge': 'Knowledge Chat',
  '/spark': 'Spark Studio',
  '/origin': 'Origin Lab',
  '/library': 'Asset Library',
  '/director-lab': 'Director Lab',
  '/argon': 'Argon Quantum RSI',
  '/loose-screw': 'looseScrew Broadcast',
  '/ai-workshop': 'AI Workshop OS (3D Monolith)',
};

export function getWindowId() {
  if (typeof window === 'undefined') return 'server';
  let id = sessionStorage.getItem(WINDOW_ID_KEY);
  if (!id) {
    id = `win_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem(WINDOW_ID_KEY, id);
  }
  return id;
}

export function getRouteLabel(pathname) {
  const p = pathname || (typeof window !== 'undefined' ? window.location.pathname : '/');
  if (p.startsWith('/watch/')) return 'Watch & VMR Inspector';
  return ROUTE_LABELS[p] || p;
}

function defaultState() {
  return {
    windows: {},
    selection: null,
    liveEdit: null,
    draft: null,
    agentReaction: null,
    updatedAt: Date.now(),
  };
}

export function readCrossTabMemory() {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const freshWindows = {};
    for (const [k, w] of Object.entries(parsed.windows || {})) {
      if (w && now - (w.lastSeenAt || 0) < 45000) {
        freshWindows[k] = w;
      }
    }
    return {
      ...defaultState(),
      ...parsed,
      windows: freshWindows,
    };
  } catch {
    return defaultState();
  }
}

let sharedChannel = null;
function getChannel() {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch {
      sharedChannel = null;
    }
  }
  return sharedChannel;
}

const listeners = new Set();

function notifyListeners(next) {
  listeners.forEach((fn) => {
    try {
      fn(next);
    } catch {}
  });
}

export function publishCrossTabPatch(patch) {
  if (typeof window === 'undefined') return defaultState();
  const winId = getWindowId();
  const route = window.location.pathname;
  const pageTitle = getRouteLabel(route);
  const current = readCrossTabMemory();

  const nextWindows = {
    ...(current.windows || {}),
    [winId]: {
      ...(current.windows?.[winId] || {}),
      windowId: winId,
      route,
      pageTitle,
      ...(patch.windowMeta || {}),
      lastSeenAt: Date.now(),
    },
  };

  const next = {
    ...current,
    ...(patch.selection !== undefined ? { selection: patch.selection } : {}),
    ...(patch.liveEdit !== undefined ? { liveEdit: patch.liveEdit } : {}),
    ...(patch.draft !== undefined ? { draft: patch.draft } : {}),
    ...(patch.agentReaction !== undefined ? { agentReaction: patch.agentReaction } : {}),
    windows: nextWindows,
    updatedAt: Date.now(),
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {}

  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage({ type: 'SYNAPSE_SYNC', state: next, sender: winId });
    } catch {}
  }

  notifyListeners(next);
  return next;
}

export function publishSelection({ text, start = 0, end = 0, field = '' }) {
  const clean = String(text || '').trim();
  if (clean.length < 2) return;
  const winId = getWindowId();
  const route = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pageTitle = getRouteLabel(route);
  return publishCrossTabPatch({
    selection: {
      text: clean.slice(0, 2000),
      start: Number(start) || 0,
      end: Number(end) || clean.length,
      field: String(field || 'Selection').slice(0, 80),
      route,
      pageTitle,
      windowId: winId,
      updatedAt: Date.now(),
    },
  });
}

export function publishLiveEdit({ title = '', body = '', field = '', draftId = '', revision = 0 }) {
  const winId = getWindowId();
  const route = typeof window !== 'undefined' ? window.location.pathname : '/';
  const pageTitle = getRouteLabel(route);
  const bodyStr = String(body || '');
  const titleStr = String(title || '');
  if (!bodyStr.trim() && !titleStr.trim()) return;

  const patch = {
    liveEdit: {
      title: titleStr.slice(0, 160),
      body: bodyStr.slice(0, 12000),
      excerpt: bodyStr.slice(0, 400),
      field: String(field || 'Workspace Editor').slice(0, 80),
      route,
      pageTitle,
      windowId: winId,
      revision: Number(revision) || 0,
      updatedAt: Date.now(),
    },
  };

  if (draftId) {
    patch.draft = {
      id: draftId,
      title: titleStr.slice(0, 160),
      body: bodyStr.slice(0, 20000),
      revision: Number(revision) || 0,
      windowId: winId,
      updatedAt: Date.now(),
    };
  }

  return publishCrossTabPatch(patch);
}

export function buildAgentCrossTabContext(extra = {}) {
  const snap = readCrossTabMemory();
  const windowsList = Object.values(snap.windows || {}).map((w) => ({
    windowId: w.windowId,
    route: w.route,
    pageTitle: w.pageTitle,
    activePanel: w.activePanel || null,
    lastSeenAt: w.lastSeenAt,
  }));
  return {
    currentWindowId: getWindowId(),
    currentRoute: typeof window !== 'undefined' ? window.location.pathname : '/',
    openWindows: windowsList,
    selection: snap.selection || null,
    liveEdit: snap.liveEdit || null,
    sharedDraft: snap.draft
      ? {
          id: snap.draft.id,
          title: snap.draft.title,
          body: String(snap.draft.body || '').slice(0, 8000),
          revision: snap.draft.revision,
        }
      : null,
    ...extra,
  };
}

export function useCrossTabMemory({ activePanel, onRemoteDraftEdit, onRemoteContext } = {}) {
  const [memory, setMemory] = useState(() => readCrossTabMemory());

  useEffect(() => {
    // Register current window presence immediately and on heartbeat
    publishCrossTabPatch({
      windowMeta: activePanel ? { activePanel } : {},
    });
    const hb = setInterval(() => {
      publishCrossTabPatch({
        windowMeta: activePanel ? { activePanel } : {},
      });
    }, 10000);
    return () => clearInterval(hb);
  }, [activePanel]);

  useEffect(() => {
    const handleSync = (nextState) => {
      setMemory(nextState);
      const myWin = getWindowId();
      if (nextState?.draft && nextState.draft.windowId !== myWin) {
        onRemoteDraftEdit?.(nextState.draft);
      }
      if (nextState?.selection && nextState.selection.windowId !== myWin) {
        onRemoteContext?.(nextState);
      }
    };

    listeners.add(handleSync);

    const ch = getChannel();
    const onChannelMsg = (ev) => {
      if (ev?.data?.type === 'SYNAPSE_SYNC' && ev.data.state) {
        handleSync(ev.data.state);
      }
    };
    if (ch) ch.addEventListener('message', onChannelMsg);

    const onStorage = (ev) => {
      if (ev.key === STORAGE_KEY && ev.newValue) {
        try {
          handleSync(JSON.parse(ev.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', onStorage);

    // Also listen for postMessage from child iframes / popped-out windows (like AI Workshop OS)
    const onWindowMsg = (ev) => {
      const d = ev?.data;
      if (!d || typeof d !== 'object') return;
      if (d.type === 'NEXUS_CHILD_SELECTION' && d.text) {
        publishSelection({
          text: d.text,
          field: d.field || 'AI Workshop 3D Monolith',
        });
      } else if (d.type === 'NEXUS_CHILD_EDIT' && (d.body || d.title)) {
        publishLiveEdit({
          title: d.title || '3D Monolith Buffer',
          body: d.body || '',
          field: d.field || 'AI Workshop 3D Monolith',
        });
      }
    };
    window.addEventListener('message', onWindowMsg);

    return () => {
      listeners.delete(handleSync);
      if (ch) ch.removeEventListener('message', onChannelMsg);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('message', onWindowMsg);
    };
  }, [onRemoteDraftEdit, onRemoteContext]);

  // Global selection & input capture across the entire window
  useEffect(() => {
    let selTimer = null;
    let editTimer = null;

    const captureSelection = () => {
      clearTimeout(selTimer);
      selTimer = setTimeout(() => {
        const activeEl = document.activeElement;
        if (
          activeEl &&
          (activeEl.tagName === 'TEXTAREA' ||
            (activeEl.tagName === 'INPUT' && activeEl.type === 'text'))
        ) {
          const s = activeEl.selectionStart ?? 0;
          const e = activeEl.selectionEnd ?? 0;
          if (e > s) {
            const txt = String(activeEl.value || '').slice(s, e);
            const label =
              activeEl.getAttribute('aria-label') ||
              activeEl.getAttribute('placeholder') ||
              'Editor Input';
            publishSelection({ text: txt, start: s, end: e, field: label });
            return;
          }
        }
        const domSel = window.getSelection?.();
        const txt = domSel ? String(domSel.toString() || '').trim() : '';
        if (txt.length >= 2) {
          publishSelection({
            text: txt,
            start: 0,
            end: txt.length,
            field: getRouteLabel(window.location.pathname),
          });
        }
      }, 120);
    };

    const captureInput = (e) => {
      const t = e.target;
      if (!t || (t.tagName !== 'TEXTAREA' && t.tagName !== 'INPUT')) return;
      if (t.type === 'password' || t.type === 'hidden') return;
      const val = String(t.value || '');
      if (val.trim().length < 2) return;
      const label =
        t.getAttribute('aria-label') ||
        t.getAttribute('placeholder') ||
        'Workspace Input';
      clearTimeout(editTimer);
      editTimer = setTimeout(() => {
        publishLiveEdit({
          title: label,
          body: val,
          field: label,
        });
      }, 200);
    };

    document.addEventListener('mouseup', captureSelection);
    document.addEventListener('keyup', captureSelection);
    document.addEventListener('input', captureInput, true);

    return () => {
      clearTimeout(selTimer);
      clearTimeout(editTimer);
      document.removeEventListener('mouseup', captureSelection);
      document.removeEventListener('keyup', captureSelection);
      document.removeEventListener('input', captureInput, true);
    };
  }, []);

  const clearSelection = useCallback(() => {
    publishCrossTabPatch({ selection: null });
  }, []);

  return {
    memory,
    windowId: getWindowId(),
    publishSelection,
    publishLiveEdit,
    publishCrossTabPatch,
    clearSelection,
  };
}