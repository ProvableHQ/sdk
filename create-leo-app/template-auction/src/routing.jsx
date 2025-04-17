import { createBrowserRouter } from "react-router-dom";
import Main from "./main.jsx";
import { CreateAuction } from "./tabs/auctioneer/CreateAuction";
import { OpenAuctions } from "./tabs/auctioneer/OpenAuctions";
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
                        <BidControls />
                        <br />
                        <Bids />
                    </>
                ),
            },
        ],
    },
]);
