import {useEffect, useState} from 'react';
import {base44} from '@/api/base44Client';

export default function useToolJobPoll(eventId, type) {
  const [result, setResult] = useState(null);
  useEffect(() => {
    setResult(null);
    if (!eventId || !type) return;
    let active = true, timer;
    const check = async () => {
      try {
        const {data} = await base44.functions.invoke(type === 'tts' ? 'nexusTTS' : 'nexusRender', {action: 'status', event_id: eventId});
        if (!active) return;
        if (data.error) throw new Error(data.error);
        if (data.status === 'done' || data.status === 'failed') {
          setResult({...data, event_id: eventId});
          return;
        }
        if (type === 'render') setResult({...data, event_id: eventId});
        timer = setTimeout(check, 3000);
      } catch (error) {
        if (active) setResult({status: 'failed', event_id: eventId, error: error.message || 'Unable to check job status.'});
      }
    };
    check();
    return () => {active = false; clearTimeout(timer);};
  }, [eventId, type]);
  return result?.event_id === eventId ? result : null;
}