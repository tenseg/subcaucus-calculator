import * as React from 'react';
import { Button } from 'primereact/button';
import { ValueCard } from './ValueCard';
// import { InputText } from 'primereact/inputtext';
import 'primereact/resources/primereact.min.css';
import 'primereact/resources/themes/nova-light/theme.css';
import 'primeicons/primeicons.css';
import './App.scss';

interface AppProps { }
interface AppState {
    name: string
    allowed: number
    dateCreated: Date
    changingName: boolean
    changingDelegates: boolean
}

export class App extends React.Component<AppProps, AppState> {

    constructor(props: AppProps) {
        super(props);
        this.state = {
            name: 'Debugging',
            allowed: 0, // make zero for release
            dateCreated: new Date(),
            changingName: false,
            changingDelegates: false,
        };
    }

    defaultName = (): string => {
        return "Meeting on " + this.state.dateCreated.toLocaleDateString("en-US")
    }

    allowedString = (): string => {
        return `${this.state.allowed} delegates to be elected`
    }

    handleChange = (name: string) => (event: React.FormEvent<HTMLInputElement>) => {
        switch (name) {
            case 'allowed':
                var allowed = Number(event.currentTarget.value)
                if (allowed < 0) {
                    allowed = 0
                }
                this.setState({ allowed: allowed })
                break;
            case 'name':
                this.setState({ name: event.currentTarget.value })
                break;
        }
    }

    focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget; // event properties must be copied to use async
        setTimeout(() => target.setSelectionRange(0, 9999), 0); // do this async to try to make Safari behave
    }

    render() {

        const showNameCard = ((this.state.name == '') || this.state.changingName)
        const nameCard = showNameCard ?
            <ValueCard
                title="What is the name of your meeting?"
                description='Most meetings have a name, like the "Ward 4 Precinct 7 Caucus" or the "Saint Paul City Convention". Specify the name of your meeting here.'
                value={this.state.name ? this.state.name : this.defaultName()}
                defaultValue={this.defaultName()}
                onSave={(value: string) => {
                    this.setState({
                        name: value,
                        changingName: false,
                    })
                }}
            />
            : <></>

        const showDelegateCard = ((!showNameCard && !this.state.allowed) || this.state.changingDelegates)
        const delegateCard = showDelegateCard ?
            <ValueCard
                title="Number of delegates allowed?"
                description="Specify the number of delegates that your meeting or caucus is allowed to send on to the next level. This is the number of delegates to be elected by your meeting."
                type="positive integer"
                value={this.state.allowed.toString()}
                onSave={(value: string) => {
                    this.setState({
                        allowed: Number(value),
                        changingDelegates: false,
                    })
                }}
            />
            : <></>

        return (
            <div className="app">
                <div className="app-content">
                    <div className="app-header">
                        <p><strong>Minnesota DFL Subcaucus Calculator</strong></p>
                    </div>
                    <div id="meeting-info">
                        <Button
                            id="meeting-name"
                            label={this.state.name ? this.state.name : this.defaultName()}
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                debug("show the name card")
                                this.setState({
                                    changingName: true,
                                })
                            }}
                        />
                        <Button
                            id="delegates-allowed"
                            label={this.allowedString()}
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                debug("show the delegate card")
                                this.setState({
                                    changingDelegates: true,
                                })
                            }}
                        />
                    </div>
                    {delegateCard}{nameCard}
                </div>
            </div>
        );
    }
}

export function debug(message?: any, ...optionalParams: any[]) {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
        console.log(message, ...optionalParams)
    }
}

