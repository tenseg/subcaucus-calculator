import * as React from 'react'
import { Button } from 'primereact/button'
import { ValueCard } from './ValueCard'
import 'primereact/resources/primereact.min.css'
import 'primereact/resources/themes/nova-light/theme.css'
import 'primeicons/primeicons.css'
import './App.scss'
import * as _u from './Utilities'
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
    showingAbout: boolean
    showingBy: boolean
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
            showingAbout: false,
            showingBy: false,
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

        if (this.state.showingAbout) {
            card = (
                <ValueCard id="about-card"
                    title="Minnesota DFL Subcaucus Calculator"
                    image="dfl.jpg"
                    onSave={() => this.setState({ showingAbout: false })}
                >
                    <p>Originally written for <a href="http://sd64dfl.org">SD64 DFL</a>, this app assists convenors of precinct caucuses and conventions in Minnesota. The Minnesota Democratic Farmer Labor (DFL) party uses a wonderful, but bit arcane, “walking subcaucus” process that is simple enough to do, but rather difficult to tabulate.</p>
                    <p>Given the number of delegates your meeting or caucus is allowed to send forward and the number of people in each subcaucus, this calculator determines how many of those delegates each subcaucus will elect. The rules it follows appeared on page 4 of the <a href="http://www.sd64dfl.org/more/caucus2014printing/2014-Official-Call.pdf">DFL 2014 Official Call</a>, including the proper treatment of remainders. It makes the math involved in a walking subcaucus disappear.</p>
                    <p>The app could be used to facilitate a “walking subcaucus” or “<a href="https://en.wikipedia.org/wiki/Proportional_representation">proportional representation</a>” system for any group.</p>
                </ValueCard>
            )
        }

        if (this.state.showingBy) {
            card = (
                <ValueCard id="by-card"
                    title="Brought to you by Tenseg LLC"
                    image="tenseg.jpg"
                    onSave={() => this.setState({ showingBy: false })}
                >
                    <p>We love the walking subcaucus process and it makes us a bit sad that the squirrelly math required to calculate who gets how many delegate discourages meetings and caucuses from using the process. We hope this calculator makes it easier for you to get to know your neighbors as you work together to change the world!</p>
                    <p>Please check us out at <a href="https://tenseg.net">tenseg.net</a> if you need help building a website or making appropriate use of technology.</p>
                </ValueCard>
            )
        }

        // show a delegates allowed card there are none allowed or we are trying to change the number
        if (!this.state.allowed || this.state.changingDelegates) {
            card = (
                <ValueCard id="delegate-value"
                    title="Number of delegates allowed?"
                    description="Specify the number of delegates that your meeting or caucus is allowed to send on to the next level. This is the number of delegates to be elected by your meeting."
                    type="positive integer"
                    value={this.state.allowed.toString()}
                    onSave={(value?: string) => {
                        if (value == undefined) {
                            this.setState({
                                changingDelegates: false,
                            })
                        } else {
                            this.setState({
                                allowed: Number(value),
                                changingDelegates: false,
                            })
                        }
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
                    onSave={(value?: string) => {
                        if (value == undefined) {
                            this.setState({
                                changingName: false,
                            })
                        } else {
                            this.setState({
                                name: value,
                                changingName: false,
                            })
                        }
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
                    <Button id="app-about-button"
                        label="Minnesota DFL Subcaucus Calculator"
                        icon="pi pi-info-circle"
                        iconPos="right"
                        onClick={() => this.setState({ showingAbout: true })}
                    />
                    <div id="meeting-info">
                        <Button id="meeting-name"
                            label={this.state.name ? this.state.name : this.defaultName()}
                            onClick={() => this.setState({ changingName: true })}
                        />
                        <Button id="delegates-allowed"
                            label={this.allowedString()}
                            onClick={() => this.setState({ changingDelegates: true })}
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
                            onClick={() => this.setState({ subcaucuses: [...this.state.subcaucuses, new Subcaucus(this.nextSubcaucusID())] })}
                        />
                    </div>
                    <Button id="app-byline"
                        label="Brought to you by Tenseg LLC"
                        href="https://tenseg.net"
                        onClick={() => this.setState({ showingBy: true })}
                    />
                    {card}
                </div>
            </div>
        )
    }
}
