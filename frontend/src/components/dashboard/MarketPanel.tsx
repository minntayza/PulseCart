'use client';

import { competitorPrices } from '@/data/competitors';

export default function MarketPanel() {
  return (
    <div className="space-y-3">
      {competitorPrices.map((item, i) => (
        <div key={i} className="p-3 bg-white/5 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-foreground">{item.productName}</h4>
            <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${
              item.recommendation === 'keep' ? 'bg-success/10 text-success' :
              item.recommendation === 'review' ? 'bg-accent/10 text-accent' :
              'bg-agent/10 text-agent'
            }`}>
              {item.recommendation}
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div>
              <span className="text-text-muted">Ours: </span>
              <span className="text-foreground font-bold">${item.ourPrice}</span>
            </div>
            <div>
              <span className="text-text-muted">Competitor: </span>
              <span className="text-foreground">${item.competitorPrice}</span>
            </div>
            <div>
              <span className={`font-bold ${item.gapPercent > 0 ? 'text-danger' : 'text-success'}`}>
                {item.gapPercent > 0 ? '+' : ''}{item.gapPercent}%
              </span>
            </div>
          </div>
          {/* Price bar visualization */}
          <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden flex">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${(item.ourPrice / Math.max(item.ourPrice, item.competitorPrice)) * 100}%` }}
            />
            <div
              className="h-full bg-text-text-muted/50 rounded-full ml-1"
              style={{ width: `${(item.competitorPrice / Math.max(item.ourPrice, item.competitorPrice)) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
