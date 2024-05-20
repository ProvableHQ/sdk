import { useMemo } from 'react'
import { WalletProvider, DecryptPermission } from "aleo-hooks"
import { LeoWalletAdapter } from '@demox-labs/aleo-wallet-adapter-leo'

import reactLogo from './assets/react.svg'
import aleoHooksLogo from '/aleo-hooks.svg'

import './App.css'
import { Demo } from './Demo'

function App() {
  const wallets = useMemo(() => [new LeoWalletAdapter({ appName: 'Aleo Hooks + React' })], [])

  return (
    <WalletProvider
      decryptPermission={DecryptPermission.AutoDecrypt}
      wallets={wallets}
      autoConnect
    >
      <div>
        <a href="https://aleo-hooks.gitbook.io/aleo-hooks/" target="_blank" rel="noreferrer">
          <img src={aleoHooksLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Aleo Hooks + React</h1>
      <div className="card">
        <Demo />
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Aleo Hooks and React logos to learn more
      </p>
    </WalletProvider>
  )
}

export default App
