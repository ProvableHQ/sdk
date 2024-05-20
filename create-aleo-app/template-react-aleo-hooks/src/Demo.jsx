import { LeoWalletName } from "@demox-labs/aleo-wallet-adapter-leo"
import { useAccount, useConnect, useDisconnect, useTransaction, Transaction, WalletAdapterNetwork } from "aleo-hooks"
import { useState } from "react"
import { useCallback } from "react"
import { useMemo } from "react"

export const Demo = () => {
    const {connect} = useConnect()
    const {disconnect} = useDisconnect()
    const {publicKey} = useAccount()

    const connectWalletHandler = useCallback(() => {
        connect(LeoWalletName)
    }, [connect])

    const walletContent = useMemo(() => {
        if (publicKey) {
            return (
                <>
                    <p>
                        Wallet address: <code>{publicKey}</code>
                    </p>
                    <button onClick={disconnect}>
                        Disconnect
                    </button>
                </>
            )
        }

        return (
            <button onClick={connectWalletHandler}>
                Connect wallet
            </button>
        )
    }, [connectWalletHandler, disconnect, publicKey])

    const [receiverAddress, setReceiverAddress] = useState("");
    const [amount, setAmount] = useState(`${1 * 10 ** 6}u64`);

    const receiverAddressChangeHandler = useCallback((e) => setReceiverAddress(e.target.value), [])
    const amountChangeHandler = useCallback((e) => setAmount(e.target.value), [])

    const { executeTransaction } = useTransaction()

    const sendCreditsClickHandler = useCallback(() => {
        const inputs = [receiverAddress, amount]

        const transaction = Transaction.createTransaction(
            receiverAddress, 
            WalletAdapterNetwork.Testnet,
            "credits.aleo",
            "transfer_public",
            inputs,
            1_000_000,
            false
        )

        executeTransaction(transaction)
    }, [executeTransaction, receiverAddress, amount])

    const sendCreditsContent = useMemo(() => {
        if (!publicKey) return null;

        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <h2>Send credits</h2>
                
                <input value={receiverAddress} onChange={receiverAddressChangeHandler} style={{ marginBottom: 10 }} placeholder="Receiver address"/>
                <input value={amount} onChange={amountChangeHandler} style={{ marginBottom: 10 }} placeholder="Amount"/>

                <button disabled={!receiverAddress || !amount} onClick={sendCreditsClickHandler}>Send</button>
            </div>
        )
    }, [publicKey, receiverAddress, amount, receiverAddressChangeHandler, amountChangeHandler, sendCreditsClickHandler])

    return (
        <div>
            {walletContent}
            {sendCreditsContent}
        </div>
    )
}