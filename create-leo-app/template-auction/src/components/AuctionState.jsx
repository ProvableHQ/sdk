import React, { createContext, useContext, useState } from "react";
import { useWallet } from "@demox-labs/aleo-wallet-adapter-react";

// Create the context with a default value
const DataContext = createContext({});

// Custom hook to use the context
export const useAuctionState = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
};

// Define the data structure
export const AuctionState = ({ children }) => {
    const [auctionState, setAuctionState] = useState({
        auctioneerRecords: [], // Raw records from the chain
        auctioneerState: {}, // Organized by auction ID
        bidderRecords: [], // Raw records from the chain
        bidderState: {}, // Organized by bidder address
        winningBids: {}, // Track winning bids by auction ID
    });

    const addNewBid = (amount, auctioneer, bidder, id, txId) => {
        setAuctionState(prevState => ({
            ...prevState,
            bidderState: {
                ...prevState.bidderState,
                [bidder]: {
                    ...prevState.bidderState[bidder],
                    bids: [
                        ...(prevState.bidderState[bidder]?.bids || []),
                        {
                            amount,
                            auctioneer,
                            bidder,
                            id,
                            txId,
                            isWinner: false,
                        },
                    ],
                },
            },
            auctioneerState: {
                ...prevState.auctioneerState,
                [id]: {
                    ...prevState.auctioneerState[id],
                    bids: [
                        ...(prevState.auctioneerState[id]?.bids || []),
                        {
                            amount,
                            auctioneer,
                            bidder,
                            id,
                            txId,
                            isWinner: false,
                        },
                    ],
                },
            },
        }));
    };

    const setWinningBid = (bid) => {
        setAuctionState(prevState => ({
            ...prevState,
            winningBids: {
                ...prevState.winningBids,
                [bid.id]: bid,
            },
            // Also update the bid in bidderState to mark it as winner
            bidderState: {
                ...prevState.bidderState,
                [bid.bidder]: {
                    ...prevState.bidderState[bid.bidder],
                    bids: prevState.bidderState[bid.bidder]?.bids.map(existingBid => 
                        existingBid.txId === bid.txId 
                            ? { ...existingBid, isWinner: true }
                            : existingBid
                    ) || [],
                },
            },
            // Update the bid in auctioneerState as well
            auctioneerState: {
                ...prevState.auctioneerState,
                [bid.id]: {
                    ...prevState.auctioneerState[bid.id],
                    bids: prevState.auctioneerState[bid.id]?.bids.map(existingBid =>
                        existingBid.txId === bid.txId
                            ? { ...existingBid, isWinner: true }
                            : existingBid
                    ) || [],
                    status: 'finished',
                },
            },
        }));
    };

    const addAuctioneerRecord = (record) => {
        setAuctionState(prevState => ({
            ...prevState,
            auctioneerRecords: [...prevState.auctioneerRecords, record],
        }));
    };

    const addAuctioneerRecords = (records) => {
        setAuctionState(prevState => ({
            ...prevState,
            auctioneerRecords: [...prevState.auctioneerRecords, ...records],
        }));
    }

    const addBidderRecord = (record) => {
        setAuctionState(prevState => ({
            ...prevState,
            bidderRecords: [...prevState.bidderRecords, record],
        }));
    };

    const addBidderRecords = (records) => {
        setAuctionState(prevState => ({
            ...prevState,
            bidderRecords: [...prevState.auctioneerRecords, ...records],
        }));
    }

    const setAuctioneerRecords = (records) => {
        console.log("Setting records", records);
        setAuctionState(prevState => ({
            ...prevState,
            auctioneerRecords: records,
        }));
    }

    const findRecordById = (recordId) => {
        return auctionState.auctioneerRecords.find(record => record.id === recordId);
    };

    return (
        <DataContext.Provider 
            value={{ 
                auctionState, 
                addNewBid, 
                setWinningBid,
                addAuctioneerRecord,
                addAuctioneerRecords,
                addBidderRecord,
                addBidderRecords,
                setAuctioneerRecords,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};
