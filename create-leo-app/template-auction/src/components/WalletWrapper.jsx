import { useMemo } from "react";
import { WalletProvider, WalletModalProvider } from "@aleowallet/react";
import { LeoWalletAdapter, PuzzleWalletAdapter } from "@aleowallet/adapters";

const WalletWrapper = ({ children }) => {
    // Initialize wallets inside a functional component using useMemo.
    const wallets = useMemo(
        () => [
            new LeoWalletAdapter({
                appName: "Leo Auction",
            }),
            new PuzzleWalletAdapter({
                programIdPermissions: {
                    ["AleoMainnet"]: [
                        "leo_auctioneer.aleo",
                    ],
                    ["AleoTestnet"]: [
                        "leo_auctioneer.aleo",
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

export default WalletWrapper;
