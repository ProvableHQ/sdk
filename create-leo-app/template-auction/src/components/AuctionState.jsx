import React, { createContext, useContext, useState } from "react";

// Create the context with a default value (null) that will be set later.
const DataContext = createContext({ });

// Custom hook to use the context.
export const useAuctionState = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
};

// Define the data structure.
export const AuctionState = ({ children }) => {
    const [data, setData] = useState({
        auctioneerRecords: [],
        auctioneerState: {},
        bidderRecords: [],
        bidderState: {},
    });

    return (
        <DataContext.Provider value={{ data, setData }}>
            {children}
        </DataContext.Provider>
    );
};
