import { createBrowserRouter } from "react-router-dom";
import Main from "./main.jsx";
import { AuctionControls } from "./tabs/auctioneer/AuctionControls";
import { AuctioneerBids} from "./tabs/auctioneer/AuctioneerBids.jsx";
import { BidControls } from "./tabs/bidder/BidControls";
import { Bids } from "./tabs/bidder/Bids";
import Homepage from "./pages/Homepage";

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
                        <AuctionControls />
                        <br />
                        <AuctioneerBids />
                    </>
                ),
            },
            {
                path: "/bidder",
                element: (
                    <>
                        <BidControls />
                        <br />
                        <Bids />
                    </>
                ),
            },
        ],
    },
]);
