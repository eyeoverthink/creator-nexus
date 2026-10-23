import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import AwakeningMusicVideoStage from '@/components/nexus/factory/AwakeningMusicVideoStage';
import { Sparkles, ExternalLink } from 'lucide-react';

export default function HomeAwakeningVideoProofBanner() {
  const [production, setProduction] = useState(null);
  const [busyShotId, setBusyShotId] = useState('');
  const [busyVideoShotId, setBusyVideoShotId] = useState('');

  useEffect(() => {
    let mounted = true;
    base44.functions
      .invoke('productionFactory', { action: 'load_factory' })
      .then((res) => {
        if (!mounted) return;
        const prods = res?.data?.productions || [];
        const mv = prods.find((p) => p.deliverable_kind === 'music_video') || prods[0];
        if (mv) setProduction(mv);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  if (!production) return null;

  const handleGenerateShotFrame = async (shotId) => {
    setBusyShotId(shotId);
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'generate_shot_frame',
        production_id: production.id,
        shot_id: shotId,
      });
      if (data?.ok && data.production) setProduction(data.production);
    } finally {
      setBusyShotId('');
    }
  };

  const handleRenderShotVideo = async (shotId) => {
    setBusyVideoShotId(shotId);
    try {
      const { data } = await base44.functions.invoke('productionFactory', {
        action: 'render_shot_video',
        production_id: production.id,
        shot_id: shotId,
      });
      if (data?.ok && data.production) setProduction(data.production);
    } finally {
      setBusyVideoShotId('');
    }
  };

  return (
    <section className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-primary" />
          <h2 className="text-base font-heading font-semibold text-foreground">
            Live Video Proof — &ldquo;The Awakening of AI&rdquo; (Check the Source · 217.9s · 138 BPM)
          </h2>
        </div>
        <Button size="sm" asChild className="h-8 text-xs gap-1.5">
          <Link to="/factory">
            Open Full Production Factory <ExternalLink size={12} />
          </Link>
        </Button>
      </div>
      <AwakeningMusicVideoStage
        production={production}
        onGenerateShotFrame={handleGenerateShotFrame}
        onRenderShotVideo={handleRenderShotVideo}
        busyShotId={busyShotId}
        busyVideoShotId={busyVideoShotId}
      />
    </section>
  );
}