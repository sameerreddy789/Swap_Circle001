'use client';

import Image from "next/image";
import { ArrowRightLeft, CheckCircle, Hourglass } from "lucide-react";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

const TradeCard = ({ trade, currentUserId, onSelect, isSelected, onMarkComplete }) => {
    const isProposer = trade.proposerId === currentUserId;
    const otherUserUsername = isProposer ? trade.receiverUsername : trade.proposerUsername;
    const itemOffered = isProposer ? trade.proposerItemName : trade.receiverItemName;
    const itemRequested = isProposer ? trade.receiverItemName : trade.proposerItemName;
    const itemOfferedImage = trade.proposerItemImageUrl || '';
    const itemRequestedImage = trade.receiverItemImageUrl || '';
    
    const userRoleField = isProposer ? 'proposer' : 'receiver';
    const otherUserRoleField = isProposer ? 'receiver' : 'proposer';
    const userAgreedStart = !!trade[`${userRoleField}AgreedStart`];
    const otherUserAgreedStart = !!trade[`${otherUserRoleField}AgreedStart`];

    const getPermanentCompleteButtonState = () => {
        if (userAgreedStart) {
            return { text: "Waiting for other...", disabled: true, icon: <Hourglass className="mr-2 h-4 w-4 animate-spin" /> };
        }
        if (otherUserAgreedStart) {
            return { text: "Confirm Completion", disabled: false, icon: <CheckCircle className="mr-2 h-4 w-4" /> };
        }
        return { text: "Mark", disabled: false, icon: <CheckCircle className="mr-2 h-4 w-4" /> };
    }

    const getStatusBadgeVariant = (status) => {
        switch (status) {
            case 'pending':
                return 'secondary';
            case 'accepted':
            case 'on-loan':
            case 'return-pending':
                return 'default';
            case 'completed':
                 return 'default';
            case 'rejected':
            case 'cancelled':
                return 'destructive';
            default:
                return 'outline';
        }
    }

    const handleButtonClick = (e) => {
        e.stopPropagation();
        if (onMarkComplete) {
            onMarkComplete(trade);
        }
    }

    return (
        <div 
            className={cn(
                "p-3 border-b cursor-pointer hover:bg-accent",
                isSelected ? "bg-accent" : ""
            )} 
            onClick={onSelect}
        >
            <div className="flex justify-between items-center mb-2">
                <p className="font-semibold text-sm">{otherUserUsername}</p>
                <Badge variant={getStatusBadgeVariant(trade.status)} className="capitalize text-xs">{trade.status.replace('-', ' ')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground truncate">{isProposer ? `You offered: ${itemOffered}` : `${otherUserUsername} offered: ${itemOffered}`}</p>
            <div className="flex items-center gap-2 mt-2">
                <Image src={itemRequestedImage} alt={itemRequested} width={40} height={40} className="rounded-md object-cover bg-muted" />
                <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                <Image src={itemOfferedImage} alt={itemOffered} width={40} height={40} className="rounded-md object-cover bg-muted" />
            </div>
            {trade.status === 'accepted' && trade.tradeType === 'permanent' && onMarkComplete && (
                <div className="mt-3">
                    {(() => {
                         const { text, disabled, icon } = getPermanentCompleteButtonState();
                         return (
                             <Button size="sm" className="w-full" variant="secondary" onClick={handleButtonClick} disabled={disabled}>
                                {icon}{text}
                            </Button>
                         )
                    })()}
                </div>
            )}
        </div>
    );
}

export default TradeCard;
