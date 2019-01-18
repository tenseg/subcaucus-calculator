import * as React from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primeicons/primeicons.css';
import './App.scss';

const logo = require('./primereact-logo.png');

interface AppProps { }
interface AppState {
    count: number;
    name: string;
    allowed: number;
}

class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            count: 0,
            name: '',
            allowed: 0,
        };
        this.increment = this.increment.bind(this);
    }

    increment() {
        this.setState({
            count: this.state.count + 1
        });
    }

    handleChange = (name: string) => (event: React.FormEvent<HTMLInputElement>) => {
        switch (name) {
            case 'allowed':
                this.setState({ allowed: Number(event.currentTarget.value) })
                break;
            case 'name': {
                this.setState({ name: event.currentTarget.value })
                break;
            }
        }
    }

    render() {
        return (
            <div className="app">
                <div className="app-header">
                    <img src={logo} className="app-logo" alt="logo" />
                </div>
                <div className="app-content">
                    <Button label="Hello, World" icon="pi pi-check" onClick={this.increment} />
                    <p>Number of Clicks: {this.state.count}</p>
                    <span className="p-float-label">
                        <InputText id="meeting-name" type="text" size={50} value={this.state.name} onChange={this.handleChange('name')} />
                        <label htmlFor="meeting-name">Meeting or Caucus Name</label>
                    </span>
                    <span className="p-float-label">
                        <InputText id="delegates-allowed" keyfilter="pint" type="text" size={30} value={this.state.allowed} onChange={this.handleChange('allowed')} />
                        <label htmlFor="delegates-allowed">Delegates Allowed</label>
                    </span>
                    {/* 
                    <Button>Hello, World</Button>
                    <Button>{__webpack_hash__}</Button>
                    <Button variant="contained" color="secondary" className={classes.button}>		{__webpack_hash__}
                    </Button>
                    <IconButton color="secondary" className={classes.button} aria-label="Add an alarm">
                        <Icon>alarm</Icon>
                    </IconButton>
                    <div className={classes.container}>
                        <TextField
                            id="caucus-name"
                            label="Meeting or Caucus"
                            placeholder="Name"
                            margin="normal"
                            variant="outlined"
                            style={{
                                flexGrow: 4,
                                width: '10em',
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <TextField
                            id="delegates-allowed"
                            label="Delegates"
                            value={this.state.delegatesAllowed || ''}
                            onChange={this.handleChange('delegatesAllowed')}
                            type="number"
                            className={classes.field}
                            style={{
                                flexGrow: 1,
                                width: '5em',
                            }}
                            inputProps={{
                                pattern: "\\d*"
                            }}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            margin="normal"
                            variant="outlined"
                            onFocus={this.handleFocusOnFullText()}
                        />
                    </div>
                    <Fab variant="extended" className={classes.button} aria-label="Add Subcaucus"><Icon className={classes.marginRight}>add</Icon> Add a Subcaucus</Fab>
                    <br></br>
                    <Fab size="medium" className={classes.button} color="secondary" aria-label="Remove Subcaucus"><Icon>remove</Icon></Fab> */}
                </div>
            </div>
        );
    }
}

export default App;
