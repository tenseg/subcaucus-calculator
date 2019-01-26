import * as React from 'react'
// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'
// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { Menubar } from 'primereact/menubar'
import { Growl } from 'primereact/growl'
import 'primereact/resources/primereact.min.css'
import 'primereact/resources/themes/nova-light/theme.css'
import 'primeicons/primeicons.css'
// see https://www.npmjs.com/package/react-json-view
import ReactJson from 'react-json-view'
// local to this app
import './App.scss'
import * as _u from './Utilities'
import { SubCalcStorage } from './SubCalcStorage'
import { Subcaucus } from './Subcaucus'
import { SubcaucusRow, SubcaucusRowAction } from './SubcaucusRow'
import { ValueCard } from './ValueCard'

/**
 * Facilitates sorting up or down (or not at all), as needed.
 */
enum SortOrder {
    Descending = -1,
    None = 0,
    Ascending = 1,
}

/**
 * Includes the modal cards we can display.
 * When more than one card is waiting to be viewed,
 * they will be presented in the order listed in
 * this enumerator.
 * 
 * NOTE: If you add a value you must also add a case
 * to the `renderNextCard()` method for the card to
 * ever be seen.
 */
enum CardFor {
    WelcomeAndSetName,
    ChangingName,
    ChangingDelegates,
    RemovingEmpties,
    ShowingAbout,
    ShowingBy,
    ShowingInstructions,
    ShowingSecurity,
}

/**
 * Details that our calculations need to share out
 * to the user.
 */
interface SummaryInfo {
    count: number
    delegates: number
    viability: number
    revisedViability: number
    minimumCountForViability: number
    nonViableCount: number
}

interface Props { }

/**
 * React state for the SubCalc App.
 */
interface State {
    created: TimestampString
    snapshot: string
    name: string
    allowed: number
    seed: number
    // card status
    cards: Array<CardFor>
    // sorting info
    sortName: SortOrder
    sortCount: SortOrder
    // summary info
    summary?: SummaryInfo
}

export class App extends React.Component<Props, State> {

    /**
     * An instance of `SubCalcStorage` that we use to
     * read and write data from and to local storage.
     */
    private storage = new SubCalcStorage()

    /**
     * An array of `Subcaucus` objects used to track
     * our subcaucuses and do calculations.
     */
    private subcaucuses = new TSMap<number, Subcaucus>()

    /**
     * Tracks the dirty state of the subcaucuses array.
     * This toggles to `true` whenever significant data
     * in the subcaucuses change. It is toggled back to
     * `false` whenever we write data out to storage.
     */
    private subcaucusesChanged = false

    /**
     * The time at which the snapshot we start with
     * was last revised.
     */
    private snapshotRevised: TimestampString = ''

    /**
     * The time of the last revision to significant
     * data in this meeting. When this differs from
     * `snapshotRevised` then we know we have what
     * may become a new snapshot (if saved).
     */
    private revised: TimestampString = ''

    /**
     * Ensures that new subcacucuses are created with
     * unique IDs. Those IDs are used as part of
     * the subcaucus row keys so that the components
     * are only reused appropriately.
     */
    private currentSubcaucusID = 1

    /**
     * To be included with component key whenever you want
     * to be sure that component will _not_ be reused
     * when the App refreshes with a new snapshot.
     */
    private keySuffix = String(Math.random())

    /**
     * This set of cards is to be presented whenever
     * the user loads a new meeting. It forces them to
     * create a meeting name and disclose the number of
     * delegates to be allowed from this meeting.
     */
    initialCardState: Array<CardFor> = [
        CardFor.WelcomeAndSetName,
        CardFor.ChangingDelegates,
        CardFor.ShowingInstructions
    ]

    /**
     * A reference to the  PrimeReact growl notifier 
     * used to share alerts with the user. This reference
     * is set during the `render()` stage.
     */
    growl: Growl | null = null

    /**
     * Creates the new SubCalc App.
     */
    constructor(props: Props) {
        super(props)

        _u.setAlertFunction(this.growlAlert)

        const meeting = this.storage.getMeetingFromLocalStorage()

        if (_u.isDebugging()) {
            this.subcaucuses = new TSMap<number, Subcaucus>()
            const timestamp = (new Date()).toTimestampString()

            this.addSubcaucus("C", 10, 0)
            this.addSubcaucus("A", 0, 0)
            this.addSubcaucus("B", 100, 5)
            this.addSubcaucus("D", 1, 0)
            this.addSubcaucus()
            this.snapshotRevised = timestamp
            this.revised = timestamp
            this.state = {
                created: timestamp,
                snapshot: 'Revised',
                name: 'Debugging', allowed: 10, cards: [],
                // name: '', allowed: 0, cards: this.initialCardState,
                seed: 42,
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
        } else if (meeting) {
            this.state = this.refreshAppFromSnapshot(meeting.current)
        } else {
            _u.alertUser(new Error("Could not read or write local storage."))

            this.subcaucuses = new TSMap<number, Subcaucus>()
            const timestamp = (new Date()).toTimestampString()
            this.snapshotRevised = timestamp
            this.revised = timestamp

            this.state = {
                created: timestamp,
                snapshot: '',
                name: 'Could not read local storage!',
                allowed: 1,
                seed: 1,
                // card status
                cards: [],
                // sorting info
                sortName: SortOrder.None,
                sortCount: SortOrder.None,
            }
        }
    }

    /**
     * Synchronizes instance variables with a new snapshot
     * and returns new state to be used to synchronize state
     * with the new snapshot as well.
     * 
     * NOTE: This function does _not_ set the state. In most
     * cases it should probably be wrapped in a `setState()` call:
     * 
     * `this.setState(this.refreshAppFromSnapshot(snapshot))`
     */
    refreshAppFromSnapshot = (snapshot: MeetingSnapshot): State => {
        this.keySuffix = String(Math.random())
        this.subcaucuses = snapshot.subcaucuses
        this.snapshotRevised = snapshot.revised
        this.revised = snapshot.revised
        this.currentSubcaucusID = snapshot.currentSubcaucusID
        return this.stateFromSnapshot(snapshot)
    }

    /**
     * Returns a `State` object which reflects the snapshot.
     */
    stateFromSnapshot = (snapshot: MeetingSnapshot): State => {
        const allowed = snapshot.allowed
        return {
            created: snapshot.created,
            snapshot: snapshot.revision,
            name: snapshot.name,
            allowed: allowed,
            seed: snapshot.seed,
            // card status
            cards: allowed ? [] : this.initialCardState,
            // sorting info
            sortName: SortOrder.None,
            sortCount: SortOrder.None,
            summary: undefined
        }
    }

    /**
     * Returns a `MeetingSnapshot` object which reflects the current state
     * and the values of various instance variables.
     */
    snapshotFromState = (): MeetingSnapshot => {
        return {
            created: this.state.created,
            revised: this.revised,
            revision: this.state.snapshot,
            name: this.state.name,
            allowed: this.state.allowed,
            seed: this.state.seed,
            currentSubcaucusID: this.currentSubcaucusID,
            subcaucuses: this.subcaucuses,
        }
    }

    /**
     * Invoked immediately after React updating occurs. 
     * Not called for the initial render.
     * 
     * Used to make sure significant changes are written
     * out to the storage manager.
     */
    componentDidUpdate = (previousProps: Props, previousState: State) => {

        if (this.subcaucusesChanged
            || this.state.name != previousState.name
            || this.state.allowed != previousState.allowed
            || this.state.seed != previousState.seed
        ) {
            this.revised = (new Date()).toTimestampString()
            this.subcaucusesChanged = false
            this.storage.writeMeetingSnapshot(this.snapshotFromState())
        }
    }

    /**
     * Request a new meeting from the storage manager and
     * set our state to reflect the new meeting.
     */
    newMeeting = () => {
        const snapshot = this.storage.newMeeting()
        this.setState(this.refreshAppFromSnapshot(snapshot))
    }

    /**
     * Increment the `currentSubcaucusID` so that each subcaucus gets a unique id.
     */
    nextSubcaucusID = () => this.currentSubcaucusID++

    /**
     * Add a subcaucus (empty by default).
     */
    addSubcaucus = (name = '', count = 0, delegates = 0) => {
        const newSubcaucus = new Subcaucus(this.nextSubcaucusID(), {
            name: name,
            count: count,
            delegates: delegates
        })
        this.subcaucuses.set(newSubcaucus.id, newSubcaucus)

        // we should only force an update if the state already exists
        // this allows us to add subcaucuses in the constructor
        // as long as we make sure to do it before we create the state
        if (this.state) this.forceSubcaucusesUpdate()
    }

    /**
     * Provide a default name for this meeting, including today's date.
     */
    defaultName = (): string => {
        return "Meeting on " + this.state.created.toDate().toLocaleDateString("en-US")
    }

    /**
     * Provide a friendly string explaining the `allowed` number.
     */
    allowedString = (): string => {
        return `${this.state.allowed} delegates to be elected`
    }

    /**
     * Add a card to an array of cards (or to the current state cards
     * if no array is provided). Note that we do not need to deduplicate
     * this array since our `removeCard()` method will remove all copies
     * of the same card anyway.
     */
    addCard = (cardFor: CardFor, to?: Array<CardFor>): Array<CardFor> => {
        if (to === undefined) {
            to = this.state.cards
        }
        return [...to, cardFor]
    }

    /**
     * Adds a card to the cards state.
     */
    addCardState = (cardFor: CardFor) => {
        this.setState({ cards: this.addCard(cardFor) })
    }

    /**
     * Remove all copies of the given card from the array of cards
     * (or from the current state cards if not array is provided).
     */
    removeCard = (seekingCardFor: CardFor, from?: Array<CardFor>): Array<CardFor> => {
        if (from === undefined) {
            from = this.state.cards
        }
        return from.filter(foundCardFor => foundCardFor != seekingCardFor)
    }

    /**
     * Removes a card from the cards state.
     */
    removeCardState = (cardFor: CardFor) => {
        this.setState({ cards: this.removeCard(cardFor) })
    }

    /**
     * Swaps a card in for another card in the cards state.
     * This can be used to make one card invoke another card.
     */
    switchCardState = (fromCardFor: CardFor, toCardFor: CardFor) => {
        let newCards = this.removeCard(fromCardFor)
        newCards = this.addCard(toCardFor, newCards)
        this.setState({ cards: newCards })
    }

    /**
     * Returns `true` if the given card is in the cards state.
     * 
     * NOTE: The card may be one of many waiting to be displayed,
     * so this may return `true` even when the card is not visible.
     */
    showingCard = (cardFor: CardFor): boolean => {
        return this.state.cards.indexOf(cardFor) > -1
    }

    /**
     * Handles changes to the `allowed` and `name` state, but 
     * nothing else. Expects to be called from an input form element.
     */
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

    /**
     * Intended to facilitate focussing on the full text, even on iOS.
     * However, this was proving problematic and is not currently in use.
     */
    focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
        const target = event.currentTarget // event properties must be copied to use async
        setTimeout(() => target.setSelectionRange(0, 9999), 0) // do this async to try to make Safari behave
    }

    /**
     * Since the subcaucuses are kept in an instance variable,
     * we cannot use `setState()` to update the interface.
     * This method changes the relevant instance variables
     * and forces an fresh render of the SubCalc App.
     */
    forceSubcaucusesUpdate = () => {
        this.subcaucusesChanged = true
        this.revised = (new Date()).toTimestampString()
        this.forceUpdate()
    }

    /**
     * Used by the `SubcaucusRow` via a callback to update the 
     * subcaucus array here in the app. 
     */
    handleSubcaucusChange = (subcaucusID: number, action: SubcaucusRowAction) => {
        _u.debug("subcaucus changed", subcaucusID, action)
        switch (action) {
            case 'remove':
                this.subcaucuses.filter((subcaucus, key) => {
                    return key != subcaucusID
                })
                this.forceSubcaucusesUpdate()
                return
            case 'enter':
                return
            case 'sync':
                return this.subcaucuses.get(subcaucusID)
            default:
                // this.subcaucuses[id] = changedSubcaucus
                const subcaucus = this.subcaucuses.get(subcaucusID)
                if (subcaucus.name != action.name || subcaucus.count != action.count) {
                    subcaucus.name = action.name
                    subcaucus.count = action.count
                    this.forceSubcaucusesUpdate()
                }
                return
        }
    }

    /**
     * Removes all empty subcaucuses or just those that are not named.
     */
    removeEmpties = (subset: 'all' | 'unnamed' = 'all') => {
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

    /**
     * Returns an icon to represent the supplied `SortOrder`.
     */
    sortOrderIcon = (order: SortOrder): string => {
        return ["pi pi-chevron-circle-down", "pi pi-circle-off", "pi pi-chevron-circle-up"][order + 1]
    }

    /**
     * Cycles through the sort orders and returns the next one.
     */
    nextSortOrder = (currentOrder: SortOrder, direction = 1): SortOrder => {
        // shifting over with +1 to nudge values over to where modulo is happy
        let nextOrder = ((currentOrder + direction + 1) % 3)
        if (nextOrder < 0) {
            nextOrder += 3 // needed to cycle backwards
        }
        // shift back over -1 to align with our sort orders again
        return nextOrder - 1
    }

    /**
     * Returns JSX for the menubar.
     */
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
                        command: () => this.growlAlert("Save snapshot.", 'warn', 'TODO')
                    },
                    {
                        label: "New meeting",
                        icon: "pi pi-fw pi-calendar-plus",
                        command: () => this.newMeeting()
                    },
                    {
                        label: "Duplicate meeting",
                        icon: "pi pi-fw pi-clone",
                        command: () => this.growlAlert("Duplicate meeting.", 'warn', 'TODO')
                    },
                    {
                        label: "Load meeting",
                        icon: "pi pi-fw pi-folder-open",
                        command: () => this.growlAlert("Load meeting.", 'warn', 'TODO')
                    },
                    {
                        label: "Flip the coin",
                        icon: "pi pi-fw pi-refresh",
                        command: () => this.growlAlert("Coin flip.", 'warn', 'TODO')
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
                        command: () => this.growlAlert("Email report.", 'warn', 'TODO')
                    },
                    {
                        label: "Download text",
                        icon: "pi pi-fw pi-align-left",
                        command: () => this.growlAlert("Download text.", 'warn', 'TODO')
                    },
                    {
                        label: "Download CSV",
                        icon: "pi pi-fw pi-table",
                        command: () => this.growlAlert("Download csv.", 'warn', 'TODO')
                    },
                    {
                        label: "Download code",
                        icon: "pi pi-fw pi-save",
                        command: () => this.growlAlert("Download code.", 'warn', 'TODO')
                    },
                ]
            },
        ]
        return <Menubar model={items} id="app-main-menu" />
    }

    /**
     * Returns JSX for the about card.
     */
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

    /**
     * Returns JSX for the instructions card.
     */
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

    /**
     * Returns JSX for the security card.
     */
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
                        onClick={() => this.growlAlert("Clear data.", 'warn', 'TODO')}
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

    /**
     * Returns JSX for the byline credit card.
     */
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

    /**
     * Returns JSX for the welcome card, which is a special version
     * of the card to enter a name for the meeting.
     */
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

    /**
     * Returns JSX for the card to change a meeting's name.
     */
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
                        onClick={() => this.growlAlert("New meeting.", 'warn', 'TODO')}
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

    /**
     * Returns JSX for the card to change the 
     * number of delegates allowed from a meeting.
     */
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
                        onClick={() => this.growlAlert("New meeting.", 'warn', 'TODO')}
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

    /**
     * Returns JSX for the card that allows the user to
     * back out of removing empty subcaucuses.
     */
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

    /**
     * Returns JSX next card to be displayed from the cards state.
     * Returns and empty JSX element if there are no cards waiting.
     * 
     * This function sorts the cards array so that highest priority
     * cards are displayed first.
     * 
     * NOTE: Please be sure to add any new `CardFor` values as 
     * cases in this function.
     */
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

    /**
     * A method to sort subcaucuses by name.
     * 
     * NOTE: This depends on the `sortName` state to determine
     * whether the result will be ascending or descending.
     */
    sortBySubcaucusName = (a: Subcaucus, b: Subcaucus): number => {

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
        return comparison * this.state.sortName
    }

    /**
     * A method to sort subcaucuses by count.
     * This method sorts first by count, then subsorts by
     * the number of delegates, and then sorts by name
     * (names will always be ascending). It also makes sure
     * that subcaucuses without any members will sort to
     * the bottom regardless of the chosen sort order.
     * 
     * NOTE: This depends on the `sortCount` state to determine
     * whether the result will be ascending or descending.
     */
    sortBySubcaucusCounts = (a: Subcaucus, b: Subcaucus): number => {

        // start with delegates, then check on count, then fall back if needed
        const delegateComparison = (a.delegates - b.delegates).comparisonValue()

        let ac = a.count ? a.count : this.state.sortCount * Infinity
        let bc = b.count ? b.count : this.state.sortCount * Infinity
        const countComparison = (ac - bc).comparisonValue()


        const weightedComparison = (0.1 * delegateComparison) + countComparison

        let comparison = weightedComparison

        if (comparison == 0) {
            // we want the names to always sort in descending order
            // during count comparisons, so we undo the effect of direction
            // (both 1 * 1 and -1 * -1 equal 1) and then force a -1 direction 
            comparison = this.sortBySubcaucusName(a, b) * this.state.sortName * -1
        }

        return comparison * this.state.sortCount
    }

    /**
     * Returns JSX for the subcaucus rows.
     */
    renderSubcaucusRows = (): JSX.Element[] => {
        // sort subcaucuses by id number by default
        let sort = (a: Subcaucus, b: Subcaucus) => {
            return a.id - b.id
        }

        if (this.state.sortName != SortOrder.None) {
            sort = this.sortBySubcaucusName
        }

        if (this.state.sortCount != SortOrder.None) {
            sort = this.sortBySubcaucusCounts
        }

        return this.subcaucuses.values().sort(sort).map((subcaucus): JSX.Element => {
            return (
                <SubcaucusRow key={`${subcaucus.id} ${this.keySuffix}`}
                    id={subcaucus.id}
                    exchange={this.handleSubcaucusChange}
                />
            )
        })
    }

    renderCalculator = (): JSX.Element => {
        const { name, snapshot, sortName, sortCount } = this.state

        return (
            <div id="calculator">
                {this.renderMenu()}
                <div id="meeting-info">
                    <div id="meeting-name" className="button"
                        onClick={() => this.addCardState(CardFor.ChangingName)}
                    >
                        {name ? name : this.defaultName()}
                        {this.revised === this.snapshotRevised && snapshot != ''
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
                                sortName: this.state.sortName ? SortOrder.None : SortOrder.Ascending,
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
                        {this.renderSubcaucusRows()}
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
                {this.renderSummary()}
            </div>
        )
    }

    /**
     * Returns JSX for the summary section of the SubCalc App.
     */
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
                        onClick={() => this.growlAlert("Explain viability in more detail.", 'warn', 'TODO')}
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

    renderByline = (): JSX.Element => {
        return (
            <Button id="app-byline"
                label="Brought to you by Tenseg LLC"
                href="https://tenseg.net"
                onClick={() => this.addCardState(CardFor.ShowingBy)}
            />
        )
    }

    renderDebuggingInfo = (): JSX.Element => {
        return (
            <div className="debugging">
                <p>This is debugging info for <a href="https://grand.clst.org:3000/tenseg/subcalc-pr/issues" target="_repository">subcalc-pr</a> (with <a href="https://reactjs.org/docs/react-component.html" target="_react">ReactJS</a>, <a href="https://www.primefaces.org/primereact/" target="_primereact">PrimeReact</a>, <a href="https://www.primefaces.org/primeng/#/icons" target="_primeicons">PrimeIcons</a>) derrived from <a href="https://bitbucket.org/tenseg/subcalc-js/src" target="_bitbucket">subcalc-js</a>.
                        </p>
                <div style={{ float: "right" }}>
                    <ReactJson name="this.storage.meetings (TSMap)" src={this.storage.meetings} />
                </div>
                <pre>{"rendered App " + (new Date()).toLocaleTimeString()}</pre>
                <ReactJson name="this.state" src={this.state} /><br />
                <ReactJson name="this.subcaucuses (TSMap)" src={this.subcaucuses} />
                <p style={{ clear: "both" }}>Done.</p>
            </div>
        )
    }

    /**
     * Shows an alert using PrimeReact `Growl` if it is available,
     * or simply as an alert if there is not growl instance yet.
     */
    growlAlert = (message: string, severity: 'error' | 'warn' | 'success' | 'info' = 'error', summary = '') => {
        if (!summary && message) {
            summary = message
            message = ''
        }
        if (this.growl) {
            this.growl.show({
                severity: severity,
                summary: summary,
                closable: false,
                detail: message
            });
        } else {
            alert(message)
        }
    }

    /**
     * Returns the JSX for the whole SubCalc App.
     */
    render() {

        _u.debug("rendering", this.subcaucuses)

        return (
            <div id="app">
                <div id="app-content">
                    {this.renderCalculator()}
                    {this.renderByline()}
                    {this.renderNextCard()}
                    <Growl ref={(el) => this.growl = el} />
                </div>
                {_u.isDebugging() ? this.renderDebuggingInfo() : ''}
            </div>
        )
    }
}
