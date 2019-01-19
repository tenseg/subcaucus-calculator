import * as React from 'react'
import { Button } from 'primereact/button'
import { ValueCard } from './ValueCard'
import 'primereact/resources/primereact.min.css'
import 'primereact/resources/themes/nova-light/theme.css'
import 'primeicons/primeicons.css'
import './App.scss'
import { debug } from './Utilities'
import { Subcaucus } from './Subcaucus'
import { SubcaucusRow } from './SubcaucusRow'

interface Props { }
interface State {
    name: string
    allowed: number
    dateCreated: Date
    changingName: boolean
    changingDelegates: boolean
    subcaucuses: Array<Subcaucus>
}

export class App extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {
            name: 'Debugging',
            allowed: 10, // make zero for release
            dateCreated: new Date(),
            changingName: false,
            changingDelegates: false,
            subcaucuses: [
                new Subcaucus(this.nextSubcaucusID()),
                new Subcaucus(this.nextSubcaucusID()),
                new Subcaucus(this.nextSubcaucusID())
            ],
        }
    }

    private _currentSubcaucusID = 1
    nextSubcaucusID = () => this._currentSubcaucusID++

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
                break
            case 'name':
                this.setState({ name: event.currentTarget.value })
                break
        }
    }

    focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget // event properties must be copied to use async
        setTimeout(() => target.setSelectionRange(0, 9999), 0) // do this async to try to make Safari behave
    }

    render() {

        // we start with an empty card, then change the value of card as circumstances warrent
        // note that the last card set "wins" in the case where multiple cards are possible
        var card = <></>

        // show a delegates allowed card there are none allowed or we are trying to change the number
        if (!this.state.allowed || this.state.changingDelegates) {
            card = (
                <ValueCard id="delegate-value"
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
            )
        }

        // show a name card if the meeting name is empty or we are trying to change the name
        if ((this.state.name == '') || this.state.changingName) {
            card = (
                <ValueCard id="name-value"
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
            )
        }

        const subcaucusRows = this.state.subcaucuses.map((subcaucus, index, number) => {
            return (
                <SubcaucusRow
                    subcaucus={subcaucus}
                />
            )
        })

        return (
            <div id="app">
                <div id="app-content">
                    <div id="app-header">
                        <p><strong>Minnesota DFL Subcaucus Calculator</strong></p>
                    </div>
                    <div id="meeting-info">
                        <Button id="meeting-name"
                            label={this.state.name ? this.state.name : this.defaultName()}
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                debug("show the name card")
                                this.setState({
                                    changingName: true,
                                })
                            }}
                        />
                        <Button id="delegates-allowed"
                            label={this.allowedString()}
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                                debug("show the delegate card")
                                this.setState({
                                    changingDelegates: true,
                                })
                            }}
                        />
                    </div>
                    <div id="subcaucus-container">
                        <div id="subcaucus-header">
                            <Button id="subcaucus-management-head"
                                label="&nbsp;"
                                disabled={true}
                            />
                            <Button id="subcaucus-name-head"
                                label="Subcaucus"
                                icon="pi pi-circle-off"
                            />
                            <Button id="subcaucus-count-head"
                                label="Count"
                                iconPos="right"
                                icon="pi pi-circle-off"
                            />
                            <Button id="subcaucus-delegate-head"
                                label="Del"
                            />
                        </div>
                        <div id="subcaucus-list">
                            {subcaucusRows}
                        </div>
                        <Button id="add-subcaucus-button"
                            label="Add a Subcaucus"
                            icon="pi pi-plus"
                        />
                    </div>
                    {card}
                </div>
            </div>
        )
    }
}
