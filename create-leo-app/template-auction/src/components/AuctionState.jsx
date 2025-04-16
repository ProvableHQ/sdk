import React, { createContext, useContext, useState } from "react";

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

    // Find an auctioneer record by its ID.
    const findAuctioneerRecordById = (recordId) => {
        return auctionState.auctioneerRecords.find(record => record.id === recordId);
    }

    // Find all auctioneer records for a given auction ID.
    const findAuctioneerRecordsByAuctionId = (auctionId) => {
        return  auctionState.auctioneerRecords.filter(record => record.data.id === `${auctionId}.private`);
    }

    // Find all unspent auctioneer records.
    const findAllUnspentAuctionRecords = () => {
        return auctionState.auctioneerRecords.filter(record => record.spent === false);
    }

    // Set the records for a given auctioneer.
    const setAuctioneerRecords = (records) => {
        console.log("Setting records", records);
        setAuctionState(prevState => ({
            ...prevState,
            auctioneerRecords: records,
        }));
    }

    // Set all records relevant to bidders.
    const setBidderRecords = (records) => {
        setAuctionState(prevState => ({
            ...prevState,
            bidderRecords: records,
        }));
    };

    return (
        <DataContext.Provider 
            value={{ 
                auctionState, 
                addNewBid, 
                setWinningBid,
                setBidderRecords,
                findAllUnspentAuctionRecords,
                findAuctioneerRecordById,
                findAuctioneerRecordsByAuctionId,
                setAuctioneerRecords,
            }}
        >
            {children}
        </DataContext.Provider>
    );
};
