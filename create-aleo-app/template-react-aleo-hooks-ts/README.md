# Aleo + Aleo React Hooks + Leo

This template includes a simple Aleo dApp that allows a user to connect Leo wallet with Aleo Hooks library.

To build and run in development mode:

```
npm i
npm run dev
```

## How to use

The detailed documentation can be found here: https://aleo-hooks.gitbook.io/aleo-hooks/

A few most commonly used hooks:

#### useConnect

The connection flow for the aleo wallets extension goes like this:

```javascript
import { FC } from 'react'
import { useConnect } from 'aleo-hooks'
import { LeoWalletName } from '@demox-labs/aleo-wallet-adapter-leo'

export const UseConnect: FC = () => {
    const { connect, connected, connecting, error } = useConnect()

    const connectHandler = () => connect(LeoWalletName)

    return (
        <div>
            {connected && <p>Successfuly connected</p>}
            {error && <p>Something went wrong {JSON.stringify(error)}</p>}
            <button disabled={connecting} onClick={connectHandler}>Connect aleo wallet</button>
        </div>
    )
}
```

#### useSelect

Use this hook for selecting current Aleo wallet. This hook is required when your frontend supports more than one wallet, e.g. Leo and Puzzle. 

```javascript
import { FC } from 'react'
import { useSelect } from 'aleo-hooks'
import { LeoWalletName } from '@demox-labs/aleo-wallet-adapter-leo'

export const UseSelect: FC = () => {
    const { select } = useSelect()

    const selectHandler = () => select(LeoWalletName)

    return (
        <div>
            <button onClick={selectHandler}>Select Leo wallet</button>
        </div>
    )
}
``` 

#### useDisconnect

Use this hook to disconnect current Aleo wallet:

```javascript
import { FC } from 'react'
import { useDisconnect } from 'aleo-hooks'

export const UseDisconnect: FC = () => {
    const { disconnect, disconnecting, error } = useDisconnect()

    const disconnectHandler = () => disconnect()

    return (
        <div>
            {error && <p>Something went wrong {JSON.stringify(error)}</p>}
            <button disabled={disconnecting} onClick={disconnectHandler}>disconnect</button>
        </div>
    )
}
```

#### useDecrypt

For decrypting ciphered text

```javascript
import { FC } from 'react'
import { useDecrypt } from 'aleo-hooks'

export const UseDecrypt: FC = () => {
    const { decryptedText, loading, error } = useDecrypt({ cipherText: 'ciphertext1qgqtzwpwj2r0rw0md3zxlnnj9h7azun02f6tdm27u8ywxcsuw4pssp7xsp7edm749l4pd9s47wksc475dkhmjnl7yrzzylgnfyx2kfwkpqlsynj2' })

    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p>Something went wrong {JSON.stringify(error)}</p>}
            {decryptedText && <p>Decrypted text: {decryptedText}</p>}
        </div>
    )
}
```

#### useViewKey

If adapter supporting fetching a view key, this hook returns a plaintext view key. 

```javascript
import { FC } from 'react'
import { useViewKey } from 'aleo-hooks'

export const UseViewKey: FC = () => {
    const { viewKey, requestViewKey, error, loading } = useViewKey()

    return (
        <div>
            {loading && <p>Loading...</p>}
            {error && <p>Something went wrong {JSON.stringify(error)}</p>}
            {viewKey && <p>View key: {viewKey}</p>}
            <button disabled={loading} onClick={requestViewKey}>Request view key</button>
        </div>
    )
}
```

#### useTransaction


```javascript
import { FC, useCallback, useState } from 'react'
import { Button } from '../button'
import { Input } from '../input'
import { cn } from '@bem-react/classname'
import { useTransaction, Transaction, WalletAdapterNetwork, useConnect } from 'aleo-hooks'

import './execute-transaction.scss'

const CnExecuteTransaction = cn('sign-message')

interface IFormData {
    program: string
    function: string
    fee: number
    address: string
    amount: string
}

type IFormDataKeys = keyof IFormData

const placeholderFromFormDataKey: Record<keyof IFormData, string> = {
    program: 'Program',
    function: 'Function',
    fee: 'Fee',
    address: 'address',
    amount: `Amount`,
}

export const ExecuteTransaction: FC = () => {
    const { transactionId, executeTransaction, error, loading } = useTransaction()
    const { address, connected } = useConnect()

    const [formData, setFormData] = useState<IFormData>({
        program: 'credits.aleo',
        function: 'transfer_public',
        fee: 1_000_000,
        amount: `${1 * 10 ** 6}u64`,
        address: '',
    })

    const formChangeHandler = useCallback((key: IFormDataKeys) => {
        return (e: React.ChangeEvent<HTMLInputElement>) => {
            setFormData((prev) => ({
                ...prev,
                [key]: key === 'fee' ? Number(e.target.value) : e.target.value,
            }))
        }
    }, [])

    const submit = useCallback(() => {
        const inputs: any = [formData.address, formData.amount]

        const aleoTransaction = Transaction.createTransaction(
            address as string,
            WalletAdapterNetwork.Testnet,
            formData.program,
            formData.function,
            inputs,
            1_000_000,
            false,
        )

        executeTransaction(aleoTransaction)
    }, [executeTransaction, address, formData])

    return (
        <div className={CnExecuteTransaction()}>
            <h2>Execute transaction</h2>

            <div className={CnExecuteTransaction('values')}>
                <div className={CnExecuteTransaction('valuesItem')}>Loading: {String(loading)}</div>
                <div className={CnExecuteTransaction('valuesItem')}>Error: {error?.message}</div>
                <div className={CnExecuteTransaction('valuesItem')}>
                    Transaction id: {transactionId}
                </div>
            </div>

            <div>
                {Object.keys(formData).map((key) => {
                    const value = formData[key as IFormDataKeys]

                    return (
                        <Input
                            key={key}
                            type={key === 'fee' ? 'number' : 'text'}
                            value={value}
                            disabled={['program', 'function'].includes(key)}
                            onChange={formChangeHandler(key as IFormDataKeys)}
                            placeholder={placeholderFromFormDataKey[key as IFormDataKeys]}
                        />
                    )
                })}

                <Button disabled={!connected} onClick={submit}>
                    {!connected ? 'Connect wallet first' : 'Execute transaction'}
                </Button>
            </div>
        </div>
    )
}
```

#### useTransaction


```javascript
import { useTransactionStatus } from 'aleo-hooks'
import { FC, useCallback, useState } from 'react'
import { Button } from '../button'
import { Input } from '../input'
import { cn } from '@bem-react/classname'

import './transaction-status.scss'

const CnTransactionStatus = cn('transactionStatus')

export const TransactionStatus: FC = () => {
    const { data, error, loading, requestTransactionStatus } = useTransactionStatus()
    const [transactionId, setTransactionId] = useState('')

    const transactionIdChangeCallback = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        setTransactionId(e.target.value)
    }, [])

    const submit = useCallback(() => {
        requestTransactionStatus(transactionId)
    }, [transactionId, requestTransactionStatus])

    return (
        <div className={CnTransactionStatus()}>
            <h2>Request transaction status</h2>

            <div className={CnTransactionStatus('values')}>
                <div className={CnTransactionStatus('valuesItem')}>Loading: {String(loading)}</div>
                <div className={CnTransactionStatus('valuesItem')}>Error: {error?.message}</div>
                <div className={CnTransactionStatus('valuesItem')}>Transaction status: {data}</div>
            </div>

            <Input
                placeholder="Transaction ID"
                value={transactionId}
                onChange={transactionIdChangeCallback}
            />
            <Button onClick={submit}>Request transaction status</Button>
        </div>
    )
}
```
