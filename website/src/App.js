import './App.css';
import React from 'react';

class Account extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
    }

    componentDidMount() {
        this.loadWasm();
    }

    loadWasm = async () => {
        try {
            const aleo = await import('aleo-wasm');
            const account = new aleo.Account().to_string();
            this.setState({ aleo, account });
        } catch(err) {
            console.error(`Unexpected error in loadWasm. [Message: ${err.message}]`);
        }
    };

    render() {
        if (this.state.aleo) {
            return <p>{this.state.account}</p>
        } else {
            return <h2>Loading...</h2>
        }
    }
}

function App() {
    return (
        <div className="App">
            <header className="App-header">
                <Account/>
            </header>
        </div>
    );
}

export default App;
