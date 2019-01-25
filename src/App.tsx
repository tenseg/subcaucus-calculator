import * as React from 'react'
// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'
// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { Menubar } from 'primereact/menubar';
import 'primereact/resources/primereact.min.css'
import 'primereact/resources/themes/nova-light/theme.css'
import 'primeicons/primeicons.css'
// local to this app
import './App.scss'
import * as _u from './Utilities'
import { SubCalcStorage } from './SubCalcStorage'
import { Subcaucus } from './Subcaucus'
import { SubcaucusRow, SubcaucusRowAction } from './SubcaucusRow'
import { ValueCard } from './ValueCard'

enum SortOrder {
    None = 0,
    Ascending,
    Descending,
}

enum CardFor {
    // these cards should be defined in priority order
    // if stacked, the ones toward the top will be shown first
    WelcomeAndSetName,
    ChangingName,
    ChangingDelegates,
    RemovingEmpties,
    ShowingAbout,
    ShowingBy,
    ShowingInstructions,
    ShowingSecurity,
}

interface SummaryInfo {
    count: number
    delegates: number
    viability: number
    revisedViability: number
    minimumCountForViability: number
    nonViableCount: number
}

interface Props { }
interface State {
    created: TimestampString
    revised: TimestampString
    snapshot: string
    name: string
    allowed: number
    // card status
    cards: Array<CardFor>
    // sorting info
    sortName: SortOrder
    sortCount: SortOrder
    // summary info
    summary?: SummaryInfo
}

export class App extends React.Component<Props, State> {

    storage: SubCalcStorage
    subcaucuses: TSMap<number, Subcaucus>

    initialCardState: Array<CardFor> = [
        CardFor.WelcomeAndSetName,
        CardFor.ChangingDelegates,
        CardFor.ShowingInstructions
    ]

    constructor(props: Props) {
        super(props)

        this.storage = new SubCalcStorage()
        this.subcaucuses = new TSMap<number, Subcaucus>()

        const timestamp = (new Date()).toTimestampString()
        this.state = {
            created: timestamp,
            revised: timestamp,
            snapshot: '',
            name: '',
            allowed: 0,
            // card status
            cards: this.initialCardState,
            // sorting info
            sortName: SortOrder.None,
            sortCount: SortOrder.None,
        }
        if (_u.isDebugging()) {
            this.addSubcaucus(false, "C", 10, 0)
            this.addSubcaucus(false, "A", 0, 0)
            this.addSubcaucus(false, "B", 100, 5)
            this.addSubcaucus(false, "D", 1, 0)
            this.addSubcaucus(false)
            this.state = {
                created: timestamp,
                revised: timestamp,
                snapshot: 'Revised',
                name: 'Debugging',
                allowed: 10,
                // card status
                cards: [],
                // sorting info
                sortName: SortOrder.None,
                sortCount: SortOrder.None,
                // summary info
                summary: {
                    count: 1234,
                    delegates: 256,
                    viability: 2.124132,
                    revisedViability: 1.92123,
                    minimumCountForViability: 3,
                    nonViableCount: 3,
                }
            }
        } else {
            this.addSubcaucus(false)
            this.addSubcaucus(false)
            this.addSubcaucus(false)
        }
    }

    private _currentSubcaucusID = 1
    nextSubcaucusID = () => this._currentSubcaucusID++

    addSubcaucus = (forceUpdate = true, name = '', count = 0, delegates = 0) => {
        const newSubcaucus = new Subcaucus(this.nextSubcaucusID(), {
            name: name,
            count: count,
            delegates: delegates
        })
        this.subcaucuses.set(newSubcaucus.id, newSubcaucus)
        if (forceUpdate) this.forceUpdate()
    }

    defaultName = (): string => {
        return "Meeting on " + this.state.created.toDate().toLocaleDateString("en-US")
    }

    allowedString = (): string => {
        return `${this.state.allowed} delegates to be elected`
    }

    addCard = (cardFor: CardFor, to?: Array<CardFor>): Array<CardFor> => {
        if (to === undefined) {
            to = this.state.cards
        }
        return [...to, cardFor]
    }

    addCardState = (cardFor: CardFor) => {
        this.setState({ cards: this.addCard(cardFor) })
    }

    removeCard = (seekingCardFor: CardFor, from?: Array<CardFor>): Array<CardFor> => {
        if (from === undefined) {
            from = this.state.cards
        }
        return from.filter(foundCardFor => foundCardFor != seekingCardFor)
    }

    removeCardState = (cardFor: CardFor) => {
        this.setState({ cards: this.removeCard(cardFor) })
    }

    switchCardState = (fromCardFor: CardFor, toCardFor: CardFor) => {
        let newCards = this.removeCard(fromCardFor)
        newCards = this.addCard(toCardFor, newCards)
        this.setState({ cards: newCards })
    }

    showingCard = (cardFor: CardFor): boolean => {
        return this.state.cards.indexOf(cardFor) > -1
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

    handleSubcaucusChange = (subcaucusID: number, action: SubcaucusRowAction) => {
        _u.debug("subcaucus changed", subcaucusID, action)
        switch (action) {
            case 'remove':
                this.subcaucuses.filter((subcaucus, key) => {
                    return key != subcaucusID
                })
                this.forceUpdate()
                return
            case 'enter':
                return
            case 'sync':
                return this.subcaucuses.get(subcaucusID)
            default:
                // this.subcaucuses[id] = changedSubcaucus
                const subcaucus = this.subcaucuses.get(subcaucusID)
                subcaucus.name = action.name
                subcaucus.count = action.count
                this.forceUpdate()
                return
        }
    }

    removeEmpties = (subset = 'all') => {
        if (subset == 'all') {
            this.subcaucuses.filter((subcaucus, key) => {
                return subcaucus.count > 0
            })
        }
        if (subset == 'unnamed') {
            this.subcaucuses.filter((subcaucus, k, i) => {
                _u.debug("remove?", subcaucus.id, subcaucus.count, subcaucus.name, subcaucus.count > 0 || subcaucus.name != '', "key", k, "index", i)
                return subcaucus.count > 0 || subcaucus.name != ''
            })
        }
        this.removeCardState(CardFor.RemovingEmpties)
    }

    sortOrderIcon = (order: SortOrder): string => {
        return ["pi pi-circle-off", "pi pi-chevron-circle-up", "pi pi-chevron-circle-down"][order]
    }

    nextSortOrder = (currentOrder: SortOrder, direction = 1): SortOrder => {
        let nextOrder = (currentOrder + direction) % 3
        if (nextOrder < 0) {
            nextOrder += 3 // needed to cycle backwards
        }
        return nextOrder
    }

    renderMenu = (): JSX.Element => {
        const items = [
            {
                label: "About",
                icon: "pi pi-fw pi-info-circle",
                items: [
                    {
                        label: "Minnesota DFL Subcaucus Calculator",
                        command: () => this.addCardState(CardFor.ShowingAbout),
                    },
                    {
                        label: "Instructions",
                        command: () => this.addCardState(CardFor.ShowingInstructions),
                    },
                    {
                        label: "Data Security",
                        command: () => this.addCardState(CardFor.ShowingSecurity),
                    },
                ]
            },
            {
                label: "Meetings",
                icon: "pi pi-fw pi-calendar",
                items: [
                    {
                        label: "Save snapshot",
                        icon: "pi pi-fw pi-clock",
                        command: () => alert("TODO: create save snapshot function.")
                    },
                    {
                        label: "New meeting",
                        icon: "pi pi-fw pi-calendar-plus",
                        command: () => alert("TODO: create new meeting function.")
                    },
                    {
                        label: "Duplicate meeting",
                        icon: "pi pi-fw pi-clone",
                        command: () => alert("TODO: create duplicate meeting function.")
                    },
                    {
                        label: "Load meeting",
                        icon: "pi pi-fw pi-folder-open",
                        command: () => alert("TODO: create load meeting function.")
                    },
                    {
                        label: "Flip the coin",
                        icon: "pi pi-fw pi-refresh",
                        command: () => alert("TODO: create coin flip function.")
                    },
                ]
            },
            {
                label: "Share",
                icon: "pi pi-fw pi-share-alt",
                items: [
                    {
                        label: "Email report",
                        icon: "pi pi-fw pi-envelope",
                        command: () => alert("TODO: create email function.")
                    },
                    {
                        label: "Download text",
                        icon: "pi pi-fw pi-align-left",
                        command: () => alert("TODO: create download text function.")
                    },
                    {
                        label: "Download CSV",
                        icon: "pi pi-fw pi-table",
                        command: () => alert("TODO: create download csv function.")
                    },
                    {
                        label: "Download code",
                        icon: "pi pi-fw pi-save",
                        command: () => alert("TODO: create download code function.")
                    },
                ]
            },
        ]
        return <Menubar model={items} id="app-main-menu" />
    }

    renderAbout = (): JSX.Element => {
        return (
            <ValueCard key="about-card" id="about-card"
                title="Minnesota DFL Subcaucus Calculator"
                image="dfl.jpg"
                onSave={() => this.removeCardState(CardFor.ShowingAbout)}
                extraButtons={
                    <Button id="show-credits-button"
                        label="Credits"
                        icon="pi pi-user"
                        className="p-button-secondary"
                        onClick={() => this.switchCardState(CardFor.ShowingAbout, CardFor.ShowingBy)}
                    />
                }
            >
                <p>Originally written for <a href="http://sd64dfl.org">SD64 DFL</a>, this app assists convenors of precinct caucuses and conventions in Minnesota. The Minnesota Democratic Farmer Labor (DFL) party uses a wonderful, but bit arcane, “walking subcaucus” process that is simple enough to do, but rather difficult to tabulate.</p>
                <p>Given the number of delegates your meeting or caucus is allowed to send forward and the number of people in each subcaucus, this calculator determines how many of those delegates each subcaucus will elect. The rules it follows appeared on page 4 of the <a href="http://www.sd64dfl.org/more/caucus2014printing/2014-Official-Call.pdf">DFL 2014 Official Call</a>, including the proper treatment of remainders. It makes the math involved in a walking subcaucus disappear.</p>
                <p>The app could be used to facilitate a “walking subcaucus” or “<a href="https://en.wikipedia.org/wiki/Proportional_representation">proportional representation</a>” system for any group.</p>
            </ValueCard>
        )
    }

    renderInstructions = (): JSX.Element => {
        return (
            <ValueCard key="instructions-card" id="instructions-card"
                title="Fill in the subcaucuses"
                image="walking.jpg"
                onSave={() => this.removeCardState(CardFor.ShowingInstructions)}
            >
                <p>Now it is time to fill in the subcaucus information. Just add each subcaucus name and the count of participants. Usually a convention or cacucus will solicit the names of subcaucuses first, feel free to enter them right away without a count. Then people will be encouraged to walk around the room and congregate with the subcaucus that most closely represents their views. When each subcacus reports how many people they attracted, you can enter that as the count for that subcaucus.</p>
                <p>As soon as you start entering subcaucus counts, the calculator will go to work determining how many delegates each subcaucus will be assigned. You can ignore those numbers until you have finished entering and confirming all the subcaucus counts. When you are done, the delegate numbers can be reported to the chair of your convention or caucus.</p>
                <p>Since most conventions or caucuses will go through more than one round of "walking", you can just keep reusing your subcaucus list for each round. However, you might want to consider these steps at the end of each round:</p>
                <ul>
                    <li>Use the "Meetings" menu at the top to save a snapshot after each round of caucusing. This will give you a good record of the whole process.</li>
                    <li>Use the "Share" menu to email a report about each round to the chair of the meeting just so they also have a clear record of the process.</li>
                </ul>
                <p>You can always get these instructions back under the "About" menu at the top. Have fun!</p>
            </ValueCard>
        )
    }

    renderSecurity = (): JSX.Element => {
        return (
            <ValueCard key="security-card" id="security-card"
                title="Data security"
                image="security.jpg"
                extraButtons={
                    <Button id="clear-data -button"
                        label="Clear All Data"
                        icon="pi pi-exclamation-triangle"
                        className="p-button-danger"
                        onClick={() => alert("TODO: create clear data function.")}
                    />
                }
                onSave={() => this.removeCardState(CardFor.ShowingSecurity)}
            >
                <p>The subcaucus calculator stores all of the data you enter on your own device. It uses a feature of web browsers called "local storage" to save all your meeting information within your web browser. None of your data gets off your device unless you choose to share it.</p>
                <p>Do note that this app is running on a web server, though, and that server will keep all the logs typical of web servers. This includes logs of your IP address and the documents you retrieve from the server. None of these logs will include your specific meeting information.</p>
                <p>One thing to be aware of is that anyone using this same browser on this same device will be able to see your meeting information, including saved snapshots and past meetings, when they come to this web site. If this is a public device and you want to clear out all the data the calculator has stored, click the "Clear All Data" button.</p>
                <p>Since the data is stored with your browser on this device, also be aware that you will not be able to see your meeting information from any other browser. This means that even you won't be able to get at this data unless you use the sharing features.</p> {/* TODO: create a transfer data feature */}
                <p>You can use the "Share" menu to get data off your device when you need to do so. Once you share your meeting information this calculator is no longer in control of that data. Make good choices about sharing.</p>
                <p>The good news is that there really isn't any private information in the calculator in the first place. Most meetings that use the walking subcacus process are public meetings and the data you store in this calculator is not sensitive. Still, we thought you'd like to know we treat it as <em>your</em> data and do not share it unless you ask us to.</p>
            </ValueCard>
        )
    }

    renderBy = (): JSX.Element => {
        return (
            <ValueCard key="by-card" id="by-card"
                title="Brought to you by Tenseg LLC"
                image="tenseg.jpg"
                onSave={() => this.removeCardState(CardFor.ShowingBy)}
            >
                <p>We love the walking subcaucus process and it makes us a bit sad that the squirrelly math required to calculate who gets how many delegate discourages meetings and caucuses from using the process. We hope this calculator makes it easier for you to get to know your neighbors as you work together to change the world!</p>
                <p>Please check us out at <a href="https://tenseg.net">tenseg.net</a> if you need help building a website or making appropriate use of technology.</p>
            </ValueCard>
        )
    }

    renderWelcomeAndSetName = (): JSX.Element => {
        return (
            <ValueCard key="welcome-card" id="welcome-card"
                title="Welcome to the Minnesota DFL Subcacus Calculator"
                image="dfl.jpg"
                description='Please start by specifying the name of your meeting here. Most meetings have a name, like the "Ward 4 Precinct 7 Caucus" or the "Saint Paul City Convention".'
                value={this.state.name}
                defaultValue={this.defaultName()}
                allowEmpty={false}
                onSave={(value?: string) => {
                    if (value == undefined) {
                        this.removeCardState(CardFor.WelcomeAndSetName)
                    } else {
                        this.setState({
                            name: value,
                            cards: this.removeCard(CardFor.WelcomeAndSetName),
                        })
                    }
                }}
            />
        )
    }

    renderChangingName = (): JSX.Element => {
        return (
            <ValueCard key="name-value" id="name-value"
                title="Meeting name?"
                value={this.state.name}
                defaultValue={this.defaultName()}
                allowEmpty={false}
                extraButtons={this.state.name
                    ? <Button id="new-meeting-button"
                        label="New meeting"
                        icon="pi pi-calendar-plus"
                        className="p-button-secondary"
                        onClick={() => alert("TODO: create new meeting function.")}
                    />
                    : <></>
                }
                onSave={(value?: string) => {
                    if (value == undefined) {
                        this.removeCardState(CardFor.ChangingName)
                    } else {
                        this.setState({
                            name: value,
                            cards: this.removeCard(CardFor.ChangingName),
                        })
                    }
                }}
            >
                <p>You can save a new name for this meeting or, if this is really a new event, you may want to start a new meeting altogether.</p>
            </ValueCard>
        )
    }

    renderChangingDelegates = (): JSX.Element => {
        return (
            <ValueCard key="delegate-value" id="delegate-value"
                title="Number of delegates allowed?"
                type="positive integer"
                value={this.state.allowed.toString()}
                allowEmpty={false}
                extraButtons={this.state.allowed
                    ? <Button id="new-meeting-button"
                        label="New meeting"
                        icon="pi pi-calendar-plus"
                        className="p-button-secondary"
                        onClick={() => alert("TODO: create new meeting function.")}
                    />
                    : <></>
                }
                onSave={(value?: string) => {
                    if (value == undefined) {
                        this.removeCardState(CardFor.ChangingDelegates)
                    } else {
                        this.setState({
                            allowed: Number(value),
                            cards: this.removeCard(CardFor.ChangingDelegates),
                        })
                    }
                }}
            >
                <p>Specify the number of delegates that your meeting or caucus is allowed to send on to the next level. This is the number of delegates to be elected by your meeting.
                {this.state.allowed
                        ? <span> If this is actually a new event, you may want to start a new meeting instead</span>
                        : <></>
                    }
                </p>
            </ValueCard>
        )
    }

    renderRemovingEmpties = (): JSX.Element => {
        return (
            <ValueCard key="remove-empties-card" id="remove-empties-card"
                title="Remove empty subcaucuses"
                footer={
                    <>
                        <Button id="remove-all-empties-button"
                            label="Remove All Empties"
                            icon="pi pi-trash"
                            onClick={() => this.removeEmpties()}
                        />
                        <Button id="remove-some-empties-button"
                            label="Remove Only Unnamed"
                            icon="pi pi-trash"
                            className="p-button-warning"
                            onClick={() => this.removeEmpties('unnamed')}
                        />
                        <Button id="cancel-remove-button"
                            label="Cancel"
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={() => this.removeCardState(CardFor.RemovingEmpties)}
                        />
                    </>
                }
            >
                <p>An "empty" subcaucus is one with no participants &mdash; a zero count.</p>
                <p>You can choose to remove all empty subcaucuses, or only those which also have no names.</p>
            </ValueCard>
        )
    }

    renderNextCard = (): JSX.Element => {
        return this.state.cards.sort((a, b) => b - a).reduce((accumulator: JSX.Element, cardFor: CardFor): JSX.Element => {
            _u.debug("filtering cards", accumulator, cardFor)
            switch (cardFor) {
                case CardFor.WelcomeAndSetName: return this.renderWelcomeAndSetName()
                case CardFor.ShowingInstructions: return this.renderInstructions()
                case CardFor.ShowingAbout: return this.renderAbout()
                case CardFor.ShowingBy: return this.renderBy()
                case CardFor.ChangingName: return this.renderChangingName()
                case CardFor.ChangingDelegates: return this.renderChangingDelegates()
                case CardFor.RemovingEmpties: return this.renderRemovingEmpties()
                case CardFor.ShowingSecurity: return this.renderSecurity()
            }
            return accumulator
        }, <></>)
    }

    renderSubcaucusRows = (): JSX.Element[] => {
        // determine how the subcaucus rows should be sorted
        let sort = (a: Subcaucus, b: Subcaucus) => {
            return a.id - b.id
        }

        if (this.state.sortName != SortOrder.None) {
            sort = (a: Subcaucus, b: Subcaucus) => {
                const direction = this.state.sortName == SortOrder.Ascending ? 1 : -1
                // fall back to order of entry
                let comparison = a.id - b.id
                const nameA = a.name ? a.name.toUpperCase() : `SUBCAUCUS ${a.id}`;
                const nameB = b.name ? b.name.toUpperCase() : `SUBCAUCUS ${b.id}`;
                if (nameA < nameB) {
                    comparison = -1;
                }
                if (nameA > nameB) {
                    comparison = 1;
                }
                return comparison * direction
            }
        }

        if (this.state.sortCount != SortOrder.None) {
            sort = (a: Subcaucus, b: Subcaucus) => {
                const direction = this.state.sortCount == SortOrder.Ascending ? 1 : -1
                // fall back to order of entry or names
                let comparison = a.id - b.id
                const nameA = a.name ? a.name.toUpperCase() : `SUBCAUCUS ${a.id}`;
                const nameB = b.name ? b.name.toUpperCase() : `SUBCAUCUS ${b.id}`;
                if (nameA < nameB) {
                    comparison = -1;
                }
                if (nameA > nameB) {
                    comparison = 1;
                }
                // start with delegates, then check on count, then fall back if needed
                let countComparison = a.delegates - b.delegates
                if (countComparison == 0) {
                    countComparison = a.count - b.count
                }
                if (countComparison == 0) {
                    return comparison
                }
                return countComparison * direction
            }
        }

        return this.subcaucuses.values().sort(sort).map((subcaucus): JSX.Element => {
            return (
                <SubcaucusRow key={subcaucus.id}
                    id={subcaucus.id}
                    exchange={this.handleSubcaucusChange}
                />
            )
        })
    }

    renderSummary = (): JSX.Element => {
        const { summary } = this.state

        return ((summary)
            ? <div id="summary-container">
                <div className="summary-row">
                    <div className="summary-label">
                        Total participants and delegates elected
                    </div>
                    <div className="summary-count">
                        <strong>
                            {summary.count.toCommaString()}
                        </strong>
                    </div>
                    <div className="summary-delegates">
                        {summary.delegates.toCommaString()}
                    </div>
                </div>
                <div className="summary-row">
                    <div className="summary-label">
                        Minimum of <strong>{summary.minimumCountForViability.singularPlural("person", "people")}</strong> needed to make a subcaucus viable
                    </div>
                </div>
                <div className="summary-row">
                    <div className="summary-label">
                        Viability number
                    </div>
                    <div className="summary-count">
                        <strong>
                            {Math.round(summary.viability * 1000) / 1000}
                        </strong>
                    </div>
                </div>
                {summary.nonViableCount
                    ? <div className="summary-row clickable"
                        onClick={() => alert("TODO: explain viability in more detail.")}
                    >
                        <div className="summary-label">
                            Recalculated viability number ({summary.nonViableCount.singularPlural("person", "people")} in non-viable subcaucuses)
                        </div>
                        <div className="summary-count">
                            {Math.round(summary.revisedViability * 1000) / 1000}
                        </div>
                    </div>
                    : ''
                }
            </div>
            : <div id="summary-container">
                <div className="summary-row">
                    <div className="summary-label">
                        To get a "viability number" just put the count of all the people in the room into a single subcaucus.
                    </div>
                </div>
            </div>
        )
    }

    render() {

        _u.debug("rendering", this.subcaucuses)

        const menu = this.renderMenu()
        const subcaucusRows = this.renderSubcaucusRows()
        const summary = this.renderSummary()
        const card = this.renderNextCard()

        const { name, revised, snapshot, created, sortName, sortCount } = this.state

        return (
            <div id="app">
                <div id="app-content">
                    {menu}
                    <div id="meeting-info">
                        <div id="meeting-name" className="button"
                            onClick={() => this.addCardState(CardFor.ChangingName)}
                        >
                            {name ? name : this.defaultName()}
                            {revised === created && snapshot != ''
                                ? <span className="snapshot">
                                    {snapshot}
                                </span>
                                : ''
                            }
                        </div>
                        <div id="delegates-allowed" className="button"
                            onClick={() => this.addCardState(CardFor.ChangingDelegates)}
                        >{this.allowedString()}</div>
                    </div>
                    <div id="subcaucus-container">
                        <div id="subcaucus-header">
                            <Button id="subcaucus-name-head"
                                label="Subcaucus"
                                icon={this.sortOrderIcon(sortName)}
                                onClick={() => this.setState({
                                    sortName: this.nextSortOrder(sortName),
                                    sortCount: SortOrder.None
                                })}
                            />
                            <Button id="subcaucus-count-head"
                                label="Count"
                                iconPos="right"
                                icon={this.sortOrderIcon(sortCount)}
                                onClick={() => this.setState({
                                    sortName: SortOrder.None,
                                    sortCount: this.nextSortOrder(sortCount, -1)
                                })}
                            />
                            <Button id="subcaucus-delegate-head"
                                label="Dels"
                            />
                        </div>
                        <div id="subcaucus-list">
                            {subcaucusRows}
                        </div>
                        <div id="subcaucus-footer">
                            <Button id="add-subcaucus-button"
                                label="Add a Subcaucus"
                                icon="pi pi-plus"
                                onClick={() => this.addSubcaucus()}
                            />
                            <Button id="remove-empty-subcaucuses-button"
                                label="Remove Empties"
                                icon="pi pi-trash"
                                onClick={() => this.addCardState(CardFor.RemovingEmpties)}
                            />
                        </div>
                    </div>
                    {summary}
                    <Button id="app-byline"
                        label="Brought to you by Tenseg LLC"
                        href="https://tenseg.net"
                        onClick={() => this.addCardState(CardFor.ShowingBy)}
                    />
                    {card}
                </div>
                {_u.isDebugging()
                    ? <div className="debugging">
                        <p>This is debugging info for <a href="https://grand.clst.org:3000/tenseg/subcalc-pr/issues" target="_repository">subcalc-pr</a> (with <a href="https://reactjs.org/docs/react-component.html" target="_react">ReactJS</a>, <a href="https://www.primefaces.org/primereact/" target="_primereact">PrimeReact</a>, <a href="https://www.primefaces.org/primeng/#/icons" target="_primeicons">PrimeIcons</a>) derrived from <a href="https://bitbucket.org/tenseg/subcalc-js/src" target="_bitbucket">subcalc-js</a>.
                        </p>
                        <pre>{"rendered App " + (new Date()).toLocaleTimeString()}</pre>
                        <pre>{"this.state is " + JSON.stringify(this.state, null, 2)}</pre>
                        <pre>{"this.subcaucuses is " + JSON.stringify(this.subcaucuses, null, 2)}</pre>
                    </div>
                    : <></>
                }
            </div>
        )
    }
}
