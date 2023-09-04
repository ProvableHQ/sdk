import { createBrowserRouter, Navigate } from "react-router-dom";
import Main from "./main.jsx";
import { NewAccount } from "./tabs/account/NewAccount.jsx";
import { AccountFromPrivateKey } from "./tabs/account/AccountFromPrivateKey.jsx";
import { AddressFromViewKey } from "./tabs/account/AddressFromViewKey.jsx";
import { SignMessage } from "./tabs/account/SignMessage.jsx";
import { VerifyMessage } from "./tabs/account/VerifyMessage.jsx";
import { DecryptRecord } from "./tabs/record/DecryptRecord.jsx";
import { GetLatestBlockHeight } from "./tabs/rest/GetLatestBlockHeight.jsx";
import { GetLatestBlock } from "./tabs/rest/GetLatestBlock.jsx";
import { GetBlockByHeight } from "./tabs/rest/GetBlockByHeight.jsx";
import { GetBlockByHash } from "./tabs/rest/GetBlockByHash.jsx";
import { GetProgram } from "./tabs/rest/GetProgram.jsx";
import { GetTransaction } from "./tabs/rest/GetTransaction.jsx";
import { EncryptAccount } from "./tabs/advanced/EncryptAccount.jsx";
import { DecryptAccount } from "./tabs/advanced/DecryptAccount.jsx";
import { ExecuteLegacy } from "./tabs/develop/ExecuteLegacy.jsx";
import { Deploy } from "./tabs/develop/Deploy.jsx";
import { Transfer } from "./tabs/develop/Transfer.jsx";
import { Split } from "./tabs/develop/Split.jsx";
import { Join } from "./tabs/develop/Join.jsx";
import { Execute } from "./tabs/develop/execute/";
import { GetMappingNames } from "./tabs/rest/GetMappingNames.jsx";
import { GetMappingValue } from "./tabs/rest/GetMappingValue.jsx";

export const router = createBrowserRouter([
    {
        element: <Main />,
        children: [
            {
                path: "/",
                element: <Navigate to="/deploy" replace={false} />,
            },
            {
                path: "/account",
                element: (
                    <>
                        <NewAccount />
                        <br />
                        <AccountFromPrivateKey />
                        <br />
                        <AddressFromViewKey />
                        <br />
                        <SignMessage />
                        <br />
                        <VerifyMessage />
                    </>
                ),
            },
            {
                path: "/record",
                element: (
                    <>
                        <DecryptRecord />
                    </>
                ),
            },
            {
                path: "/rest",
                element: (
                    <>
                        <GetLatestBlockHeight />
                        <br />
                        <GetLatestBlock />
                        <br />
                        <GetBlockByHeight />
                        <br />
                        <GetBlockByHash />
                        <br />
                        <GetProgram />
                        <br />
                        <GetMappingNames />
                        <br />
                        <GetMappingValue />
                        <br />
                        <GetTransaction />
                    </>
                ),
            },
            {
                path: "/advanced",
                element: (
                    <>
                        <EncryptAccount />
                        <br />
                        <DecryptAccount />
                    </>
                ),
            },
            {
                path: "/develop",
                element: (
                    <>
                        <Execute />
                        <br />
                        <Deploy />
                    </>
                ),
            },
            {
                path: "/transfer",
                element: (
                    <>
                        <Transfer />
                        <br />
                        <Split />
                        <br />
                        <Join />
                    </>
                ),
            },
            {
                path: "/execute_legacy",
                element: (
                    <>
                        <ExecuteLegacy />
                    </>
                ),
            },
        ],
    },
]);
