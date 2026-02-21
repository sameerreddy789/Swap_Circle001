
'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UploadCloud, ChevronsUpDown, Check } from "lucide-react";
import { useUser, useFirestore, addDocumentNonBlocking } from "@/firebase";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { collection, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useEffect, useMemo, useState } from "react";
import { uploadImage } from "@/firebase/storage";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { locations } from "@/lib/locations";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const categories = ['Electronics', 'Fashion', 'Home', 'Books', 'Sports', 'Tools', 'Hobbies', 'Other'];
const conditions = ['New', 'Used - Like New', 'Used - Good', 'Used - Fair'];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const itemSchema = z.object({
  name: z.string().min(3, "Item name must be at least 3 characters long."),
  category: z.string({ required_error: "Please select a category." }),
  condition: z.string({ required_error: "Please select a condition." }),
  image: z.instanceof(File, { message: "Please upload an image file." })
           .refine(file => file.size < MAX_FILE_SIZE, `Image must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB.`),
  description: z.string().min(10, "Description must be at least 10 characters long."),
  lookingFor: z.string().min(3, "Please describe what you're looking for."),
  location: z.string().min(1, "Please select a location."),
  landmark: z.string().min(3, "Landmark must be at least 3 characters long."),
  tradePreference: z.enum(['permanent', 'temporary'], { required_error: "Please select a trade type." }),
  loanDurationDays: z.number().min(1, "Duration must be at least 1 day.").max(180, "Duration cannot exceed 180 days.").optional(),
}).refine(data => {
    if (data.tradePreference === 'temporary') {
        return data.loanDurationDays !== undefined;
    }
    return true;
}, {
    message: "Please enter a valid swap duration.",
    path: ["loanDurationDays"],
});

export default function NewItemPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const router = useRouter();
    const { toast } = useToast();
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [openLocationPopover, setOpenLocationPopover] = useState(false);


    const form = useForm({
        resolver: zodResolver(itemSchema),
        defaultValues: {
            name: "",
            description: "",
            lookingFor: "",
            location: "",
            landmark: "",
            tradePreference: 'permanent',
            loanDurationDays: undefined,
        },
    });
    
    const tradePreference = form.watch('tradePreference');

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login?redirect=/items/new');
        }
    }, [isUserLoading, user, router]);

    const itemsCollection = useMemo(() => {
        if (!firestore) return null;
        return collection(firestore, "items");
    }, [firestore]);
    
    const onSubmit = async (data) => {
        if (!user || !itemsCollection) {
            toast({ variant: "destructive", title: "Error", description: "You must be logged in to list an item." });
            return;
        }
        
        if (!locations.includes(data.location)) {
            toast({
                variant: 'destructive',
                title: 'Invalid Location',
                description: 'Please select a location from the list.',
            });
            return;
        }

        setIsSubmitting(true);
        toast({
            title: "Listing your item...",
            description: "Please wait while we upload your image and save the details.",
        });
        
        try {
            const { url, thumbUrl } = await uploadImage(data.image);

            const itemData = {
                name: data.name,
                category: data.category,
                condition: data.condition,
                description: data.description,
                lookingFor: data.lookingFor,
                location: data.location,
                landmark: data.landmark,
                imageUrl: url,
                thumbnailUrl: thumbUrl,
                ownerId: user.uid,
                ownerUsername: user.displayName || user.email?.split('@')[0],
                createdAt: serverTimestamp(),
                imageHint: 'custom item',
                status: 'available',
                tradePreference: data.tradePreference,
            };

            if (data.tradePreference === 'temporary') {
                itemData.loanDurationDays = data.loanDurationDays;
            }

            addDocumentNonBlocking(itemsCollection, itemData);
            
            toast({
                title: "Success!",
                description: "Your item has been listed.",
            });

            router.push("/items");

        } catch (error) {
            toast({
                variant: "destructive",
                title: "Uh oh! Something went wrong.",
                description: error.message || "Could not list your item. Please try again.",
            });
        } finally {
           setIsSubmitting(false);
        }
    };
    
    const processFile = (file) => {
        if (file) {
            form.setValue("image", file, { shouldValidate: true });
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files?.[0];
        if(file) processFile(file);
    }
    
    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.currentTarget.contains(e.relatedTarget)) {
            return;
        }
        setIsDragging(false);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    if (isUserLoading || (!user && !isUserLoading)) {
        return (
             <div className="container max-w-2xl mx-auto py-12 px-4 md:px-6">
                <div className="space-y-4 mb-8 text-center">
                    <h1 className="text-4xl font-bold tracking-tight">List a New Item</h1>
                    <p className="text-muted-foreground text-lg">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div 
            className="container max-w-2xl mx-auto py-12 px-4 md:px-6"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="space-y-4 mb-8 text-center">
                <h1 className="text-4xl font-bold tracking-tight">List a New Item</h1>
                <p className="text-muted-foreground text-lg">Share something great with the community.</p>
            </div>
            <Form {...form}>
                <form 
                    onSubmit={form.handleSubmit(onSubmit)} 
                    className="space-y-6"
                >
                    <fieldset disabled={isSubmitting} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Vintage Polaroid Camera" {...field} className="rounded-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                control={form.control}
                                name="category"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Category</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-full"><SelectValue placeholder="Select a category" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="condition"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Condition</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="rounded-full"><SelectValue placeholder="Select a condition" /></SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {conditions.map(con => <SelectItem key={con} value={con}>{con}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="image"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Item Photo</FormLabel>
                                    <FormControl>
                                        <div className="flex items-center justify-center w-full">
                                            <Label 
                                                htmlFor="dropzone-file" 
                                                className={cn("flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-accent/50 transition-colors", {
                                                    'border-primary bg-accent/50': isDragging,
                                                    'cursor-not-allowed opacity-50': isSubmitting,
                                                })}
                                            >
                                                {imagePreview ? (
                                                    <div className="relative w-full h-full">
                                                        <Image src={imagePreview} alt="Preview" layout="fill" objectFit="contain" className="rounded-lg" />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                        <UploadCloud className="w-8 h-8 mb-4 text-muted-foreground" />
                                                        <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                                        <p className="text-xs text-muted-foreground">PNG, JPG, or GIF (MAX. 10MB)</p>
                                                    </div>
                                                )}
                                                <Input id="dropzone-file" type="file" className="hidden" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} disabled={isSubmitting} />
                                            </Label>
                                        </div> 
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Tell everyone about your item. What makes it special?" rows={5} {...field} className="rounded-lg" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="lookingFor"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>What are you looking for?</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="e.g., Old video games, a nice jacket, etc." rows={3} {...field} className="rounded-lg" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="tradePreference"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Trade Preference</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                            className="flex flex-col space-y-1"
                                        >
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="permanent" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Permanent Swap</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-3 space-y-0">
                                                <FormControl>
                                                    <RadioGroupItem value="temporary" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Temporary Swap</FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {tradePreference === 'temporary' && (
                            <FormField
                                control={form.control}
                                name="loanDurationDays"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Swap Duration (in days)</FormLabel>
                                        <FormControl>
                                            <Input 
                                                type="number" 
                                                placeholder="e.g., 7 (max 180)" 
                                                min="1"
                                                max="180"
                                                {...field}
                                                value={field.value ?? ''}
                                                onChange={e => field.onChange(parseInt(e.target.value, 10) || undefined)}
                                                className="rounded-full"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}


                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Location (City)</FormLabel>
                                     <Popover open={openLocationPopover} onOpenChange={setOpenLocationPopover}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className={cn("w-full justify-between rounded-full", !field.value && "text-muted-foreground")}
                                                >
                                                    {field.value ? locations.find(loc => loc === field.value) : "Select location"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search location..." />
                                                <CommandEmpty>No location found.</CommandEmpty>
                                                <CommandList>
                                                    <CommandGroup>
                                                        {locations.map((loc) => (
                                                            <CommandItem
                                                                value={loc}
                                                                key={loc}
                                                                onSelect={() => {
                                                                    form.setValue("location", loc)
                                                                    setOpenLocationPopover(false)
                                                                }}
                                                            >
                                                                <Check className={cn("mr-2 h-4 w-4", loc === field.value ? "opacity-100" : "opacity-0")} />
                                                                {loc}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="landmark"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Landmark or Area</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Near City Park" {...field} className="rounded-full" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                    </fieldset>
                    <Button type="submit" size="lg" className="w-full rounded-full" disabled={isSubmitting}>
                        {isSubmitting ? 'Listing Item...' : 'List My Item'}
                    </Button>
                </form>
            </Form>
        </div>
    );
}
