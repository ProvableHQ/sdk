import { createBrowserRouter } from "react-router-dom";
import Main from "./main.jsx";
import { CreateAuction } from "./tabs/auctioneer/CreateAuction";
import { OpenAuctions } from "./tabs/auctioneer/OpenAuctions";
import { BidExplorer } from "./tabs/bidder/BidExplorer.jsx";
import Homepage from "./pages/Homepage";
import { AuctionExplorer } from './tabs/bidder/AuctionExplorer';

export const router = createBrowserRouter([
    {
        path: "/",
        element: <Homepage />,
    },
    {
        element: <Main />,
        children: [
            {
                path: "/auctioneer",
                element: (
                    <>
                        <CreateAuction />
                        <br />
                        <OpenAuctions />
                    </>
                ),
            },
            {
                path: "/bidder",
                element: (
                    <>
                        <AuctionExplorer />
                        <br />
                        <BidExplorer />
                    </>
                ),
            },
        ],
    },
    {
        path: '/explore',
        element: <AuctionExplorer />
    },
]);
