'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SaveItemButton from './save-item-button';
import { useUser } from '@/firebase';
import React from 'react';
import { MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const getConditionClass = (condition) => {
    switch (condition) {
        case 'New':
        case 'Used - Like New':
            return 'condition-badge-success';
        case 'Used - Good':
            return 'condition-badge-primary';
        case 'Used - Fair':
            return 'condition-badge-warning';
        default:
            return 'bg-secondary text-secondary-foreground border-border';
    }
};

const ItemCard = React.memo(function ItemCard({ item, postedAt }) {
  const { user } = useUser();
  const blurDataURL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mOM+P/9HwAE/gJ/wG0eRgAAAABJRU5ErkJggg==';
  
  const imageUrl = item.thumbnailUrl || item.imageUrl;
  const canSave = user && user.uid !== item.ownerId;

  return (
    <Card className="overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-white">
      <CardContent className="p-0">
        <div className="relative">
          <Link href={`/items/${item.id}`} className="block overflow-hidden rounded-t-2xl">
            <Image
              src={imageUrl}
              alt={item.name}
              width={400}
              height={300}
              className="object-cover w-full h-48 group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={item.imageHint}
              placeholder="blur"
              blurDataURL={blurDataURL}
            />
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
             {postedAt && (
                <Badge variant="secondary" className="absolute top-2 left-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {postedAt}
                </Badge>
             )}
          </Link>
          {canSave && (
             <div className="absolute top-2 right-2">
                <SaveItemButton itemId={item.id} />
             </div>
          )}
        </div>
        <div className="p-4 space-y-3">
          <h3 className="font-bold text-lg leading-tight truncate text-card-foreground">{item.name}</h3>
          
          <div className="flex justify-between items-center text-sm">
            <p className="text-muted-foreground text-xs font-medium truncate">{item.category}</p>
            <Badge className={cn("text-xs font-semibold", getConditionClass(item.condition))}>{item.condition}</Badge>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground text-xs pt-2 border-t border-border">
                <MapPin className="h-3.5 w-3.5"/>
                <span className="truncate">{item.location}</span>
          </div>

           <div className="text-xs text-muted-foreground">
              Trade: <span className="font-medium text-foreground capitalize">{item.tradePreference}</span>
              {item.tradePreference === 'temporary' && ` (${item.loanDurationDays} days)`}
            </div>
        </div>
      </CardContent>
    </Card>
  );
});

export default ItemCard;
