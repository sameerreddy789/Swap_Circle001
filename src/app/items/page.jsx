
'use client';
import ItemCard from '@/components/item-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X } from 'lucide-react';
import { useCollection, useFirestore } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useMemoFirebase } from '@/firebase/provider';
import ActiveFilters from '@/components/active-filters';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import Autoplay from "embla-carousel-autoplay";
import { formatDistanceToNow } from 'date-fns';
import { useLoading } from '@/hooks/use-loading';

const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Tools', 'Hobbies', 'Other'];
const conditions = ['All', 'New', 'Used - Like New', 'Used - Good', 'Used - Fair'];
const swapTypes = ['All', 'Permanent', 'Temporary'];
const durations = ['All', 'Short-term (1-7 days)', 'Medium-term (8-30 days)', 'Long-term (31+ days)'];
const sortOptions = ['Newest first'];

export default function ItemsPage() {
  const firestore = useFirestore();
  const { showLoader, hideLoader } = useLoading();


  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('All');
  const [condition, setCondition] = useState('All');
  const [location, setLocation] = useState('');
  const [swapType, setSwapType] = useState('All');
  const [duration, setDuration] = useState('All');

  // State for sorting
  const [sortBy, setSortBy] = useState(sortOptions[0]);

  // Data fetching - IMPORTANT: We now filter for 'available' items directly in the query
  const itemsQuery = useMemoFirebase(() => query(collection(firestore, 'items'), where('status', '==', 'available')), [firestore]);

  const { data: items, isLoading: itemsLoading } = useCollection(itemsQuery);
  
  const isLoading = itemsLoading;

  useEffect(() => {
    if (isLoading) {
      showLoader();
    } else {
      hideLoader();
    }
  }, [isLoading, showLoader, hideLoader]);

  const [timeSinceMap, setTimeSinceMap] = useState(new Map());

  useEffect(() => {
    if (items) {
      const newMap = new Map();
      items.forEach(item => {
        if (item.createdAt) {
          newMap.set(item.id, formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true }));
        }
      });
      setTimeSinceMap(newMap);
    }
  }, [items]);
  

  const featuredItems = useMemo(() => {
    if (!items) return [];
    // The items are already filtered by 'available' status from the query
    return [...items]
      .sort((a, b) => (b.createdAt?.toDate() ?? 0) - (a.createdAt?.toDate() ?? 0))
      .slice(0, 10);
  }, [items]);
  
  const filteredAndSortedItems = useMemo(() => {
    if (!items) return [];

    let filtered = items.filter(item => {
      const searchMatch = searchTerm ? item.name.toLowerCase().includes(searchTerm.toLowerCase()) : true;
      const locationMatch = location ? (item.location || '').toLowerCase().includes(location.toLowerCase()) : true;
      const categoryMatch = category !== 'All' ? item.category === category : true;
      const conditionMatch = condition !== 'All' ? item.condition === condition : true;
      const swapTypeMatch = swapType !== 'All' ? item.tradePreference === swapType.toLowerCase() : true;
      
      // The statusMatch is now handled by the Firestore query, so it's always true here.

      let durationMatch = true;
      if (swapType === 'Temporary' && duration !== 'All') {
        const days = item.loanDurationDays || 0;
        if (duration === 'Short-term (1-7 days)') durationMatch = days >= 1 && days <= 7;
        else if (duration === 'Medium-term (8-30 days)') durationMatch = days >= 8 && days <= 30;
        else if (duration === 'Long-term (31+ days)') durationMatch = days > 30;
      }

      return searchMatch && locationMatch && categoryMatch && conditionMatch && swapTypeMatch && durationMatch;
    });

    // Sorting logic
    return filtered.sort((a, b) => {
        switch (sortBy) {
            case 'Newest first':
            default:
                 if (!a.createdAt || !b.createdAt) return 0;
                 return b.createdAt.toDate() - a.createdAt.toDate();
        }
    });

  }, [items, searchTerm, location, category, condition, swapType, duration, sortBy]);
  
  const activeFilters = useMemo(() => {
    const filters = [];
    if (category !== 'All') filters.push({ key: 'category', value: category, clear: () => setCategory('All') });
    if (condition !== 'All') filters.push({ key: 'condition', value: condition, clear: () => setCondition('All') });
    if (swapType !== 'All') filters.push({ key: 'swapType', value: swapType, clear: () => setSwapType('All') });
    if (location) filters.push({ key: 'location', value: location, clear: () => setLocation('') });
    if (duration !== 'All' && swapType === 'Temporary') filters.push({ key: 'duration', value: duration, clear: () => setDuration('All') });
    return filters;
  }, [category, condition, swapType, location, duration]);
  
  const clearAllFilters = useCallback(() => {
    setSearchTerm('');
    setCategory('All');
    setCondition('All');
    setLocation('');
    setSwapType('All');
    setDuration('All');
  }, []);
  
  if (isLoading) {
    return null; // The loading overlay will be shown by the effect
  }


  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      {/* Featured Items Section */}
        <section className="py-12">
          <div className="container mx-auto px-4 md:px-6">
            <div className="space-y-4 text-center">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl text-foreground">Recently Listed Items</h2>
              <p className="text-muted-foreground md:text-xl/relaxed">Find your next treasure. New items are added every day.</p>
            </div>
            <Carousel 
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 3000,
                  stopOnInteraction: true,
                  stopOnMouseEnter: true,
                }),
              ]}
              className="w-full mt-12"
            >
              <CarouselContent>
                 {isLoading ? (
                   Array.from({ length: 5 }).map((_, i) => (
                    <CarouselItem key={i} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                       <div className="space-y-2 p-1">
                          <Skeleton className="h-60 w-full rounded-2xl" />
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex justify-between">
                            <Skeleton className="h-5 w-20" />
                            <Skeleton className="h-5 w-24" />
                          </div>
                        </div>
                    </CarouselItem>
                  ))
                ) : (
                  featuredItems.map(item => (
                    <CarouselItem key={item.id} className="basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4">
                      <div className="p-1">
                        <ItemCard item={item} postedAt={timeSinceMap.get(item.id)} />
                      </div>
                    </CarouselItem>
                  ))
                )}
              </CarouselContent>
            </Carousel>
          </div>
        </section>

      <div className="space-y-4 mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">Discover All Items</h1>
        <p className="text-muted-foreground text-lg">Find something new to you. Start a trade today.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 mb-8 p-4 bg-black/30 backdrop-blur-lg border border-white/10 shadow-lg rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Search for items..." 
                className="pl-10 rounded-full" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
             <Input 
              placeholder="Location" 
              className="rounded-full"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
             <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="rounded-full"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                {sortOptions.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
              </SelectContent>
            </Select>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="rounded-full"><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>
                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="rounded-full"><SelectValue placeholder="Condition" /></SelectTrigger>
              <SelectContent>
                {conditions.map(con => <SelectItem key={con} value={con}>{con}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={swapType} onValueChange={setSwapType}>
                <SelectTrigger className="rounded-full"><SelectValue placeholder="Swap Type" /></SelectTrigger>
                <SelectContent>
                    {swapTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                </SelectContent>
            </Select>
            {swapType === 'Temporary' && (
                <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="rounded-full"><SelectValue placeholder="Duration" /></SelectTrigger>
                    <SelectContent>
                        {durations.map(dur => <SelectItem key={dur} value={dur}>{dur}</SelectItem>)}
                    </SelectContent>
                </Select>
            )}
        </div>
        
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-default mt-4">
            <ActiveFilters filters={activeFilters} />
            <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground">
                <X className="mr-2 h-4 w-4" /> Clear All
            </Button>
          </div>
        )}
      </div>
      
      <div className="mb-4 text-sm text-muted-foreground">
        {isLoading ? 'Loading items...' : `${filteredAndSortedItems.length} items found.`}
      </div>


      {/* Items Grid */}
      {filteredAndSortedItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filteredAndSortedItems.map(item => (
              <ItemCard key={item.id} item={item} postedAt={timeSinceMap.get(item.id)} />
            ))}
        </div>
      ) : (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-lg font-semibold">No items found.</p>
            <p>Try adjusting your filters or check back later!</p>
          </div>
      )}
    </div>
  );
}
