import { useMemo } from "react";
import { WalletProvider } from "@demox-labs/aleo-wallet-adapter-react";
import { WalletModalProvider } from "@demox-labs/aleo-wallet-adapter-reactui";
import {
    PuzzleWalletAdapter,
    // LeoWalletAdapter,
    FoxWalletAdapter,
    SoterWalletAdapter,
    // configureConnectionForPuzzle,
} from "aleo-adapters";
import {
    DecryptPermission,
    WalletAdapterNetwork,
} from "@demox-labs/aleo-wallet-adapter-base";
import { LeoWalletAdapter } from "@demox-labs/aleo-wallet-adapter-leo";
import "@demox-labs/aleo-wallet-adapter-reactui/styles.css";
import { WalletNotConnectedError } from '@demox-labs/aleo-wallet-adapter-base';

export const WalletWrapper = ({ children }) => {
    // Initialize wallets inside a functional component using useMemo.
    const wallets = useMemo(
        () => [
            new LeoWalletAdapter({
                appName: "Leo Auction",
            }),
            new PuzzleWalletAdapter({
                programIdPermissions: {
                    ["AleoMainnet"]: [
                        "private_auction.aleo",
                    ],
                    ["AleoTestnet"]: [
                        "private_auction.aleo",
                    ],
                },
                appName: "Leo Auction",
                appDescription: "A simple auction game",
            }),
        ],
        []
    );

    return (
        <WalletProvider
            wallets={wallets}
            decryptPermission={DecryptPermission.UponRequest}
            network={WalletAdapterNetwork.TestnetBeta} // Change to 'MainnetBeta' or 'TestnetBeta' if needed
            autoConnect
        >
            <WalletModalProvider>
                {children}
            </WalletModalProvider>
        </WalletProvider>
    );
};