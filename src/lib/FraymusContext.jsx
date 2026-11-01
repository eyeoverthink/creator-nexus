import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import * as FM from '@/lib/fraymusMail';

const STORAGE_KEY = 'fraymusWorld.visitor.v1';

const FraymusContext = createContext(null);

export function FraymusProvider({ children }) {
  const [visitor, setVisitor] = useState(null);
  const [directory, setDirectory] = useState([]);
  const [fleet, setFleet] = useState([]);
  const [inboxMessages, setInboxMessages] = useState([]);
  const [watcherStatus, setWatcherStatus] = useState(null);
  const [selfTestResult, setSelfTestResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize or restore v16 visitor identity from localStorage['fraymusWorld.visitor.v1']
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const st = await FM.selfTest();
        if (mounted) setSelfTestResult(st);

        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          const ok = await FM.checkIdentity(parsed);
          if (ok && mounted) {
            setVisitor(parsed);
            return;
          }
        }
        // Provision a sovereign visitor keypair in-browser (private key never leaves browser)
        const fresh = await FM.newIdentity('nexus-operator');
        localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        if (mounted) setVisitor(fresh);
      } catch {
        // Ignore init error
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Support FRAYMUS Mail postMessage identity handoff (Section 1C.10)
  useEffect(() => {
    const onMessage = async (event) => {
      const data = event?.data;
      if (data && data.type === 'FRAYMUS_IDENTITY_HANDOFF' && data.identity) {
        const ok = await FM.checkIdentity(data.identity);
        if (ok) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.identity));
          setVisitor(data.identity);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, []);

  // Signed visitorRelay(visitor, action, body) — signs every request with canonical('mail', number, ts)
  // Private key NEVER leaves the browser; server only receives auth = { number, pubkey, ts, sig }
  const visitorRelay = useCallback(async (v, action, body = {}) => {
    let auth = null;
    if (v && v.secret && v.number) {
      const ts = new Date().toISOString();
      const canon = FM.canonical('mail', v.number, ts);
      const sig = await FM.sign(v.secret, canon);
      auth = {
        number: v.number,
        name: v.name,
        pubkey: v.public,
        ts,
        sig,
      };
    }
    const res = await base44.functions.invoke('openclawGateway', {
      action: 'v16_visitor_relay',
      v16_action: action,
      ...body,
      auth,
    });
    return res?.data || {};
  }, []);

  const relay = useCallback(
    (action, body = {}) => visitorRelay(visitor, action, body),
    [visitor, visitorRelay]
  );

  const refreshDirectory = useCallback(async () => {
    try {
      const res = await visitorRelay(visitor, 'directory', {});
      if (Array.isArray(res?.agents)) {
        setDirectory(res.agents);
        setFleet(res.agents.filter((a) => a.is_ai !== false));
      }
      if (res?.watcherStatus) {
        setWatcherStatus(res.watcherStatus);
      }
      return res;
    } catch {
      return null;
    }
  }, [visitor, visitorRelay]);

  const refreshInbox = useCallback(async () => {
    if (!visitor?.secret) return [];
    try {
      const res = await FM.inbox((a, b) => visitorRelay(visitor, a, b), visitor);
      if (Array.isArray(res?.messages)) {
        setInboxMessages(res.messages);
      }
      return res?.messages || [];
    } catch {
      return [];
    }
  }, [visitor, visitorRelay]);

  useEffect(() => {
    if (!visitor) return;
    refreshDirectory();
    refreshInbox();
    const timer = setInterval(() => {
      refreshDirectory();
    }, 60000);
    return () => clearInterval(timer);
  }, [visitor, refreshDirectory, refreshInbox]);

  // Key import from JSON keyfile (Section 1C.2)
  const loadKey = useCallback(
    async (fileOrJson) => {
      const text =
        typeof fileOrJson === 'string' ? fileOrJson : await fileOrJson.text();
      const parsed = JSON.parse(text);
      const valid = await FM.checkIdentity(parsed);
      if (!valid) {
        throw new Error('Keyfile failed Ed25519 checkIdentity() verification');
      }
      if (String(parsed.number).startsWith('fx-0601') || String(parsed.number).startsWith('fx-5066')) {
        throw new Error('Owner-key boundary: Never import or sign with Vaughn owner key (fx-0601) in client relay.');
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      setVisitor(parsed);
      await visitorRelay(parsed, 'register', {
        number: parsed.number,
        name: parsed.name,
        pubkey: parsed.public,
        skills: ['v16-signed-mail', 'hash-chain'],
      });
      await refreshDirectory();
      return parsed;
    },
    [visitorRelay, refreshDirectory]
  );

  const createNewIdentity = useCallback(
    async (name = 'nexus-visitor') => {
      const fresh = await FM.newIdentity(name);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
      setVisitor(fresh);
      await FM.register((a, b) => visitorRelay(fresh, a, b), fresh, [
        'v16-ed25519',
        'hash-chain',
        'triple-proof',
      ]);
      await refreshDirectory();
      return fresh;
    },
    [visitorRelay, refreshDirectory]
  );

  // Send hash-chained signed message via FM.send() and update local head
  const sendSignedMessage = useCallback(
    async (toNumber, payloadText) => {
      if (!visitor) throw new Error('No active v16 identity loaded');
      const { packet, relayResponse } = await FM.send(
        (a, b) => visitorRelay(visitor, a, b),
        visitor,
        toNumber,
        payloadText,
        visitor.head || 'GENESIS'
      );
      const updatedVisitor = { ...visitor, head: packet.id };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedVisitor));
      setVisitor(updatedVisitor);
      await refreshInbox();
      await refreshDirectory();
      return { packet, relayResponse };
    },
    [visitor, visitorRelay, refreshInbox, refreshDirectory]
  );

  const lookupAgent = useCallback(
    (numberOrName) => {
      const q = String(numberOrName || '').toLowerCase().trim();
      if (!q) return null;
      return (
        directory.find(
          (a) =>
            String(a.number || '').toLowerCase() === q ||
            String(a.number || '').toLowerCase().startsWith(q) ||
            String(a.name || '').toLowerCase() === q
        ) || null
      );
    },
    [directory]
  );

  const myNumber = useCallback(() => visitor?.number || null, [visitor]);

  const isRegistered = useCallback(() => {
    if (!visitor?.number) return false;
    return directory.some((a) => a.number === visitor.number);
  }, [visitor, directory]);

  const value = useMemo(
    () => ({
      visitor,
      relay,
      directory,
      fleet,
      inboxMessages,
      watcherStatus,
      selfTestResult,
      loading,
      refreshDirectory,
      refreshInbox,
      loadKey,
      createNewIdentity,
      sendSignedMessage,
      lookupAgent,
      myNumber,
      isRegistered,
      FM,
    }),
    [
      visitor,
      relay,
      directory,
      fleet,
      inboxMessages,
      watcherStatus,
      selfTestResult,
      loading,
      refreshDirectory,
      refreshInbox,
      loadKey,
      createNewIdentity,
      sendSignedMessage,
      lookupAgent,
      myNumber,
      isRegistered,
    ]
  );

  return <FraymusContext.Provider value={value}>{children}</FraymusContext.Provider>;
}

export function useFraymus() {
  const ctx = useContext(FraymusContext);
  if (!ctx) {
    throw new Error('useFraymus must be used inside <FraymusProvider>');
  }
  return ctx;
}

// Phase 3: Shared Agent Directory Hook — useFraymusDirectory()
export function useFraymusDirectory() {
  const { directory, fleet, refreshDirectory } = useFraymus();

  const byNumber = useCallback(
    (fx) => {
      const q = String(fx || '').toLowerCase().trim();
      return (
        directory.find(
          (a) =>
            String(a.number || '').toLowerCase() === q ||
            String(a.number || '').toLowerCase().startsWith(q)
        ) || null
      );
    },
    [directory]
  );

  const byName = useCallback(
    (name) => {
      const q = String(name || '').toLowerCase().trim();
      return (
        directory.find(
          (a) =>
            String(a.name || '').toLowerCase() === q ||
            String(a.name || '').toLowerCase().includes(q)
        ) || null
      );
    },
    [directory]
  );

  const bySkill = useCallback(
    (skill) => {
      const q = String(skill || '').toLowerCase().trim();
      return directory.filter((a) =>
        (a.skills || []).some((s) => String(s).toLowerCase().includes(q))
      );
    },
    [directory]
  );

  return {
    agents: directory,
    fleet,
    byNumber,
    byName,
    bySkill,
    refresh: refreshDirectory,
  };
}