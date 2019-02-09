import * as React from 'react'

// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { Menubar } from 'primereact/menubar'
import { Growl } from 'primereact/growl'
import 'primereact/resources/primereact.min.css'
import 'primereact/resources/themes/nova-light/theme.css'
import 'primeicons/primeicons.css'

// see https://github.com/kennethjiang/js-file-download
import fileDownload from 'js-file-download'

// local to this app
import './App.scss'
import * as _u from './Utilities'
import { SubCalc } from './SubCalc'
import { Snapshot } from './Snapshot'
import { Subcaucus } from './Subcaucus'
import { SubcaucusRow, SubcaucusRowAction } from './SubcaucusRow'
import { ValueCard } from './ValueCard'
import { Loader } from './Loader'
import { ShowJSON } from './ShowJSON'

// cards
import { RemovingEmptiesCard } from './Cards/RemovingEmptiesCard';
import { ChangingCoinCard } from './Cards/ChangingCoinCard';
import { ChangingDelegatesAllowedCard } from './Cards/ChangingDelegatesAllowedCard';
import { ChangingNameCard } from './Cards/ChangingNameCard';
import { SavingSnapshotCard } from './Cards/SavingSnapshotCard';
import { SavingSnapshotBeforeCard } from './Cards/SavingSnapshotBeforeCard';
import { WelcomeAndSetNameCard } from './Cards/WelcomeAndSetNameCard';
import { InstructionsCard } from './Cards/InstructionsCard';
import { AboutCard } from './Cards/AboutCard';
import { CreditCard } from './Cards/CreditCard';
import { SecurityCard } from './Cards/SecurityCard';
import { ViabilityCard } from './Cards/ViabilityCard';

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
    Nothing = 0,
    WelcomeAndSetName,
    ChangingName,
    ChangingDelegates,
    ChangingCoin,
    SavingSnapshot,
    SavingSnapshotBefore,
    RemovingEmpties,
    ShowingAbout,
    ShowingBy,
    ShowingInstructions,
    ShowingSecurity,
    Viability,
}

enum Presenting {
    Calculator,
    Loading,
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
    // modal interactions
    cards: Array<CardFor>
    before?: string
    afterBefore?: () => void
    present: Presenting
    // sorting info
    sortName: SortOrder
    sortCount: SortOrder
}

export class App extends React.Component<Props, State> {

    /**
     * An instance of `SubCalc` that we use to
     * read and write data from and to local storage.
     */
    private subcalc = new SubCalc()

    /**
     * To be included with component key whenever you want
     * to be sure that component will _not_ be reused
     * when the App refreshes with a new snapshot.
     * 
     * Change this value whenever you need to force
     * the subcaucus lines to reset:
     * 
```typescript
this.keySuffix = String(_u.randomSeed())
```
     */
    private keySuffix = String(_u.randomSeed())

    /**
     * This set of cards is to be presented whenever
     * the user loads a new meeting. It forces them to
     * create a meeting name and disclose the number of
     * delegates to be allowed from this meeting.
     */
    initialCardState: Array<CardFor> = [
        CardFor.WelcomeAndSetName,
        CardFor.ChangingDelegates,
        // CardFor.ShowingInstructions
    ]

    /**
     * A reference to the  PrimeReact growl notifier 
     * used to share alerts with the user. This reference
     * is set during the `render()` stage.
     */
    growl: Growl | null = null

    /**
     * Default settings for our tooltips.
     */
    tooltipOptions = {
        showDelay: 1500, // 1.5 seconds
        hideDelay: 333, // 1/3 second
        position: 'top',
    }

    /**
     * Creates the new SubCalc App.
     */
    constructor(props: Props) {
        super(props)

        _u.setAlertFunction(this.growlAlert)

        this.subcalc.snapshot.redistributeDelegates()

        let cards: Array<CardFor> = this.subcalc.snapshot.allowed ? [] : this.initialCardState
        let before: string | undefined = undefined
        let afterBefore: (() => void) | undefined = undefined

        if (this.subcalc.incoming.length > 0) {
            if (this.subcalc.snapshot.revision === '') {
                cards = [CardFor.SavingSnapshotBefore]
                afterBefore = this.completeIncoming
            } else {
                this.completeIncoming()
            }
        }

        this.state = {
            // card status
            cards: cards,
            present: Presenting.Calculator,
            before: before,
            afterBefore: afterBefore,
            // sorting info
            sortName: SortOrder.None,
            sortCount: SortOrder.None,
        }
    }

    /**
     * Either load the snapshot or return to the calculator.
     * This is used as a callback from the loading component.
     */
    loadSnapshot = (snapshot?: Snapshot) => {
        if (snapshot) {
            this.subcalc.setSnapshot(snapshot)
            this.subcalc.snapshot.redistributeDelegates()
        }
        this.setState({ present: Presenting.Calculator })
    }

    /**
     * Change the meeting name here and in storage.
     * 
     * NOTE: This is _not_ considered a revision of the snapshot
     * since the meeting name will apply to all snapshots from this meeting.
     */
    setStateName = (name: string) => {
        this.subcalc.renameMeeting(name)
        this.forceUpdate()
    }

    /**
     * Change the number of delegates allowed here and in storage.
     */
    setStateAllowed = (allowed: number) => {
        this.subcalc.reviseSnapshot({ allowed: allowed })
        this.forceUpdate()
    }

    /**
     * Change the random seed (the "coin") here and in storage.
     */
    setStateSeed = (seed: number) => {
        this.subcalc.reviseSnapshot({ seed: seed })
        this.forceUpdate()
    }

    /**
     * Change force and update of the interface and storage
     * due to changes in the subcaucuses.
     */
    setStateSubcaucuses = () => {
        this.subcalc.reviseSnapshot()
        this.forceUpdate()
    }

    /**
     * Request the storage manager to finish importing from the query parameters.
     */
    completeIncoming = () => {
        this.subcalc.completeIncoming()
        if (this.state) {
            this.keySuffix = String(_u.randomSeed())
            this.forceUpdate()
        }
    }

    /**
     * Request a new meeting from the storage manager and
     * set our state to reflect the new meeting.
     */
    newMeeting = () => {
        this.subcalc.newSnapshot()
        this.keySuffix = String(_u.randomSeed())
        this.setState({
            present: Presenting.Calculator,
            cards: this.initialCardState
        })
    }

    /**
     * Request a new meeting from the storage manager and
     * set our state to reflect the new meeting.
     */
    duplicateMeeting = () => {
        this.subcalc.duplicateSnapshot()
        this.growlAlert(this.subcalc.snapshot.name, 'success', 'Snapshot Duplicated')
        this.keySuffix = String(_u.randomSeed())
        this.forceUpdate()
    }

    /**
     * Request a new meeting from the storage manager and
     * set our state to reflect the new meeting.
     */
    saveSnapshot = (revision?: string, remove: CardFor = CardFor.SavingSnapshot) => {
        if (revision) {
            this.subcalc.saveSnapshot(revision)
            this.growlAlert(revision, 'success', 'Snapshot Saved')
        }
        this.removeCardState(remove)
    }

    emailSnapshot = () => {
        const snapshot = this.subcalc.snapshot

        const url = snapshot.asURL()

        let body = snapshot.asText()

        body += "\nOpen this snapshot yourself by clicking on this very long and ugly link:\n\n" + url + "\n"

        let subject = "Subcaucus Report for ";
        subject += snapshot.name
        subject += snapshot.revision ? ` (${snapshot.revision})` : ''

        const mailto = "mailto:?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)

        location.href = mailto
    }

    /**
     * Provide a default name for this meeting, including today's date.
     */
    defaultName = (): string => {
        return "Meeting on " + this.subcalc.snapshot.created.toDate().toLocaleDateString("en-US")
    }

    /**
     * Provide a friendly string explaining the `allowed` number.
     */
    allowedString = (): string => {
        return `${this.subcalc.snapshot.allowed} delegates to be elected`
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
        if (cardFor === CardFor.Nothing) return
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
                this.setStateAllowed(allowed)
                break
            case 'name':
                this.setStateName(event.currentTarget.value)
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
     * Used by the `SubcaucusRow` via a callback to update the 
     * subcaucus array here in the app. 
     */
    handleSubcaucusChange = (subcaucus: Subcaucus, action: SubcaucusRowAction, index?: number, callback?: () => void) => {
        _u.debug("subcaucus changed", subcaucus.id, subcaucus.debug(), action)
        switch (action) {
            case 'enter':
                if (index) {
                    _u.debug("enter index", index, "length", this.subcalc.snapshot.subcaucuses.length)
                    if (index === this.subcalc.snapshot.subcaucuses.length
                        || index === this.subcalc.snapshot.subcaucuses.length * 2) {
                        this.subcalc.snapshot.addSubcaucus()
                    }
                    this.setStateSubcaucuses()
                    if (callback) {
                        callback()
                    }

                }
                return
            case 'recalc':
                // this is a signal to recalculate
                this.setStateSubcaucuses()
                return
        }
    }

    /**
     * Removes all empty subcaucuses or just those that are not named.
     */
    removeEmpties = (subset: 'all' | 'unnamed' = 'all') => {
        if (subset == 'all') {
            this.subcalc.snapshot.subcaucuses.filter((subcaucus, key) => {
                return subcaucus.count > 0
            })
            this.subcalc.reviseSnapshot()
        }
        if (subset == 'unnamed') {
            this.subcalc.snapshot.subcaucuses.filter((subcaucus, k, i) => {
                _u.debug("remove?", subcaucus.id, subcaucus.count, subcaucus.name, subcaucus.count > 0 || subcaucus.name != '', "key", k, "index", i)
                return subcaucus.count > 0 || subcaucus.name != ''
            })
        }
        this.removeCardState(CardFor.RemovingEmpties)
        this.subcalc.reviseSnapshot()
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
     * If the snapshot has been revised, offers a chance to save
     * the changes before proceeding with the action in the callback.
     * The title will be used on the card that suggests saving.
     */
    checkForRevisionBefore = (callback: () => void, title?: string) => {
        if (this.subcalc.snapshot.revision == "") {
            this.setState({ afterBefore: callback, before: title })
            this.addCardState(CardFor.SavingSnapshotBefore)
        } else {
            callback()
        }
    }

    /**
     * Returns JSX for the menubar.
     * 
     * NOTE: Do not `setState()` in this method.
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
                        label: "New meeting",
                        icon: "pi pi-fw pi-calendar-plus",
                        command: () => this.checkForRevisionBefore(this.newMeeting, "Before creating a new meeting...")
                    },
                    {
                        label: "Open snapshot",
                        icon: "pi pi-fw pi-folder-open",
                        command: () => this.checkForRevisionBefore(() => this.setState({ present: Presenting.Loading }), "Before opening a snapshot...")
                    },
                    {
                        label: "Save snapshot",
                        icon: "pi pi-fw pi-clock",
                        command: () => this.addCardState(CardFor.SavingSnapshot),
                    },
                    {
                        label: "Duplicate meeting",
                        icon: "pi pi-fw pi-clone",
                        command: () => this.checkForRevisionBefore(this.duplicateMeeting, "Before duplicating the meeting...")
                    },
                    {
                        label: "Change the coin",
                        icon: "pi pi-fw pi-refresh",
                        command: () => this.addCardState(CardFor.ChangingCoin)
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
                        command: this.emailSnapshot
                    },
                    {
                        label: "Text download",
                        icon: "pi pi-fw pi-align-left",
                        command: () => {
                            if (_u.isApp()) {
                                location.href = "subcalc://share-text/" + encodeURIComponent(this.subcalc.snapshot.asText())
                            } else {
                                _u.download(this.subcalc.snapshot.asText(), 'subcalc.txt')
                            }
                        }
                    },
                    {
                        label: "CSV download",
                        icon: "pi pi-fw pi-table",
                        command: () => {
                            if (_u.isApp()) {
                                location.href = "subcalc://share-csv/" + encodeURIComponent(this.subcalc.snapshot.asCSV()) + "?filename=subcalc"
                            } else {
                                _u.download(this.subcalc.snapshot.asCSV(), 'subcalc.csv', 'text/csv')
                            }
                        }
                    },
                    {
                        label: "JSON download",
                        icon: "pi pi-fw pi-save",
                        command: () => {
                            const jsnap = this.subcalc.snapshot.toJSON()
                            if (_u.isApp()) {
                                location.href = "subcalc://share-text/" + encodeURIComponent(JSON.stringify(jsnap, null, 2))
                            } else {
                                _u.download(JSON.stringify(jsnap, null, 2), 'subcalc.json', 'application/json')
                            }
                        }
                    },
                    {
                        label: "Copy link",
                        icon: "pi pi-fw pi-external-link",
                        command: () => {
                            if (_u.isApp()) {
                                location.href = "subcalc://share-text/" + encodeURIComponent(this.subcalc.snapshot.asURL())
                            } else {
                                const success = _u.copyToClipboard(this.subcalc.snapshot.asURL())
                                if (success) {
                                    this.growlAlert(`A very long URL is now ready to be pasted.`, 'success', 'Link Copied')
                                } else {
                                    this.growlAlert(`Failed to get a copy.`, 'error', 'Not copied!')
                                }
                            }
                        }
                    },
                ]
            },
        ]
        return <Menubar key="calculator-menu" model={items} id="app-main-menu" />
    }

    /**
     * Returns JSX next card to be displayed from the cards state.
     * Returns and empty JSX element if there are no cards waiting.
     * 
     * This function sorts the cards array so that highest priority
     * cards are displayed first.
     * 
     * NOTE: Please be sure to add any new `CardFor` values as 
     * cases in this function. Do not `setState()` in this method.
     */
    renderNextCard = (): JSX.Element => {
        return this.state.cards.sort((a, b) => b - a).reduce((accumulator: JSX.Element, cardFor: CardFor): JSX.Element => {
            _u.debug("filtering cards", accumulator, cardFor)
            switch (cardFor) {
                case CardFor.WelcomeAndSetName: return <WelcomeAndSetNameCard
                    name={this.subcalc.snapshot.name}
                    defaultName={this.defaultName()}
                    save={this.saveName}
                />
                case CardFor.ShowingInstructions: return <InstructionsCard
                    save={() => this.removeCardState(CardFor.ShowingInstructions)}
                />
                case CardFor.ShowingAbout: return <AboutCard
                    save={() => this.removeCardState(CardFor.ShowingAbout)}
                    showCredits={() => this.switchCardState(CardFor.ShowingAbout, CardFor.ShowingBy)}
                />
                case CardFor.ShowingBy: return <CreditCard
                    save={() => this.removeCardState(CardFor.ShowingBy)}
                />
                case CardFor.SavingSnapshotBefore: return <SavingSnapshotBeforeCard
                    name={this.subcalc.snapshot.name}
                    save={this.saveSnapshotBefore}
                    title={this.state.before}
                />
                case CardFor.SavingSnapshot: return <SavingSnapshotCard
                    name={this.subcalc.snapshot.name}
                    save={this.saveSnapshot}
                />
                case CardFor.ChangingName: return <ChangingNameCard
                    name={this.subcalc.snapshot.name}
                    defaultName={this.defaultName()}
                    save={this.saveName}
                    newMeeting={this.newMeeting}
                />
                case CardFor.ChangingDelegates: return <ChangingDelegatesAllowedCard
                    allowed={this.subcalc.snapshot.allowed}
                    save={this.saveDelegatesAllowed}
                    newMeeting={this.newMeeting}
                />
                case CardFor.ChangingCoin: return <ChangingCoinCard
                    value={this.subcalc.snapshot.seed.toString()}
                    allowed={this.subcalc.snapshot.allowed}
                    save={this.saveRandomSeed}
                    generate={this.generateRandomSeed}
                />
                case CardFor.RemovingEmpties: return <RemovingEmptiesCard
                    removeEmpties={this.removeEmpties}
                    cancel={() => this.removeCardState(CardFor.RemovingEmpties)}
                />
                case CardFor.ShowingSecurity: return <SecurityCard
                    save={() => this.removeCardState(CardFor.ShowingSecurity)}
                    clearData={() => {
                        this.subcalc.clear()
                        this.keySuffix = String(_u.randomSeed())
                        this.setState({ cards: this.initialCardState })
                        this.growlAlert("Starting again from scratch!", 'warn', 'Storage Cleared')
                    }}
                />
                case CardFor.Viability: return <ViabilityCard
                    save={() => this.removeCardState(CardFor.Viability)}
                    snapshot={this.subcalc.snapshot}
                />
            }
            return accumulator
        }, <></>)
    }

    /**
     * Callback for the card that allows for a snapshot to be saved before doing something else.
     */
    saveSnapshotBefore = (value?: string) => {
        _u.debug("sSnapBefore", this.state.cards)
        this.removeCardState(CardFor.SavingSnapshotBefore)
        if (value !== undefined) {
            this.saveSnapshot(value, CardFor.Nothing)
            if (this.state.afterBefore) {
                this.state.afterBefore()
            }
        }
    }

    /**
     * Callback for the changing name card to shave a new meeting name.
     */
    saveName = (value?: string) => {
        if (value == undefined) {
            this.removeCardState(CardFor.ChangingName)
        } else {
            this.setState({ cards: this.removeCard(CardFor.WelcomeAndSetName, this.removeCard(CardFor.ChangingName)) })
            this.setStateName(value)
        }
    }

    /**
     * Callback for the delegates allowed card to shave a new number of delegates.
     */
    saveDelegatesAllowed = (value?: string) => {
        if (value == undefined) {
            this.removeCardState(CardFor.ChangingDelegates)
        } else {
            this.setState({ cards: this.removeCard(CardFor.ChangingDelegates) })
            this.setStateAllowed(Number(value))
        }
    }

    /**
     * Callback for the changing coin card to generate a new random seed.
     */
    generateRandomSeed = () => {
        this.subcalc.reviseSnapshot({ seed: _u.randomSeed() })
        this.growlAlert(`Random seed is now ${this.subcalc.snapshot.seed}.`, 'success', 'New Random Coin')
        this.removeCardState(CardFor.ChangingCoin)
    }

    /**
     * Callback for the changing coin card to save a specified random seed.
     */
    saveRandomSeed = (value?: string) => {
        if (value == undefined) {
            this.removeCardState(CardFor.ChangingCoin)
        } else {
            const seed = Number(value)
            if (seed === this.subcalc.snapshot.seed) {
                this.growlAlert(`Random seed is still ${this.subcalc.snapshot.seed}.`, 'info', 'Coin not changed')
            } else {
                this.subcalc.reviseSnapshot({ seed: seed })
                this.growlAlert(`Random seed is now ${this.subcalc.snapshot.seed}.`, 'success', 'New Chosen Coin')
            }
            this.removeCardState(CardFor.ChangingCoin)
        }
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
        const nameA = a.displayName().toUpperCase()
        const nameB = b.displayName().toUpperCase()
        if (nameA < nameB) {
            comparison = -1
        }
        if (nameA > nameB) {
            comparison = 1
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
     * 
     * NOTE: Do not `setState()` in this method.
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

        return this.subcalc.snapshot.subcaucuses.values().sort(sort).map((subcaucus, index, array): JSX.Element => {
            return (
                <SubcaucusRow key={`${subcaucus.id} ${this.keySuffix}`}
                    subcaucus={subcaucus}
                    index={index + 1}
                    rows={array.length}
                    exchange={this.handleSubcaucusChange}
                />
            )
        })
    }

    /**
     * Returns JSX for the summary section of the SubCalc App.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderSummary = (): JSX.Element => {
        return ((this.subcalc.snapshot.participants > 0)
            ? <div id="summary-container"
                onClick={() => this.addCardState(CardFor.Viability)}
            >
                <div className="summary-row">
                    <div className="summary-label">
                        Total participants and delegates elected
                    </div>
                    <div className="summary-count">
                        <strong>
                            {this.subcalc.snapshot.participants.toCommaString()}
                        </strong>
                    </div>
                    <div className="summary-delegates">
                        {this.subcalc.snapshot.totalDelegates.toCommaString()}
                    </div>
                </div>
                <div className="summary-row">
                    <div className="summary-label">
                        <strong>Viability number</strong> (members needed for viable subcaucus)
                    </div>
                    <div className="summary-count">
                        <strong>
                            {this.subcalc.snapshot.viabilityNumber}
                        </strong>
                    </div>
                </div>
                {
                    this.subcalc.snapshot.viableParticipants < this.subcalc.snapshot.participants
                        ? <div className="summary-row">
                            <div className="summary-label">
                                Total members of viable subcaucuses
                    </div>
                            <div className="summary-count">
                                {this.subcalc.snapshot.viableParticipants.toCommaString()}
                            </div>
                            <div className="summary-delegates">
                                &nbsp;
                    </div>
                        </div>
                        : ''
                }
                <div className="summary-row">
                    <div className="summary-label">
                        Delegate divisor (members needed for each delegate)
                    </div>
                    <div className="summary-count">
                        {this.subcalc.snapshot.delegateDivisor.decimalPlaces(3)}
                    </div>
                </div>
                {
                    this.subcalc.snapshot.viableParticipants < this.subcalc.snapshot.participants
                        ? <div className="summary-row danger">
                            <div className="summary-label">
                                {(this.subcalc.snapshot.participants - this.subcalc.snapshot.viableParticipants).singularPlural("person", "people")} in a non-viable subcaucus, you may want to consider another round of walking
                            </div>
                        </div>
                        : ''
                }
            </div >
            : <div id="summary-container">
                <div className="summary-row">
                    <div className="summary-label">
                        To get an initial "viability number" just make all the people in the room members of a single subcaucus.
                    </div>
                </div>
            </div>
        )
    }

    /**
     * Returns JSX for the whole calculator.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderCalculator = (): JSX.Element => {
        const { sortName, sortCount } = this.state
        const snapshot = this.subcalc.snapshot
        const { name, revision } = snapshot

        return (
            <div id="calculator">
                {this.renderMenu()}
                <div id="meeting-info">
                    <div id="meeting-name" className="button"
                        onClick={() => this.addCardState(CardFor.ChangingName)}
                    >
                        {name ? name : this.defaultName()}
                        {revision != ''
                            ? <span className="snapshot">
                                {revision}
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
                            label="Subcaucuses"
                            icon={this.sortOrderIcon(sortName)}
                            onClick={() => this.setState({
                                sortName: this.state.sortName ? SortOrder.None : SortOrder.Ascending,
                                sortCount: SortOrder.None
                            })}
                        />
                        <Button id="subcaucus-count-head"
                            label="Members"
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
                            label="Add Subcaucus"
                            icon="pi pi-plus"
                            onClick={() => {
                                snapshot.addSubcaucus()
                                this.setStateSubcaucuses()
                            }}
                        />
                        <Button id="remove-empty-subcaucuses-button"
                            label="Empties"
                            icon="pi pi-trash"
                            tooltip="Remove subcaucuses that have no members"
                            tooltipOptions={this.tooltipOptions}
                            onClick={() => this.addCardState(CardFor.RemovingEmpties)}
                        />
                        <Button id="clear-counts-button"
                            icon="pi pi-minus-circle"
                            tooltip="Zero out the members of each subcaucus"
                            tooltipOptions={this.tooltipOptions}
                            onClick={() => this.checkForRevisionBefore(() => {
                                this.subcalc.zeroSubcaucuses()
                                this.keySuffix = String(_u.randomSeed())
                                this.forceUpdate()
                            }, "Before zeroing out the subcaucuses...")}
                        />
                        {_u.isDebugging()
                            ? <Button id="random-coin-button"
                                icon="pi pi-refresh"
                                className="p-button-success"
                                tooltip="Get new random seed for the coin"
                                tooltipOptions={this.tooltipOptions}
                                onClick={() => {
                                    this.subcalc.reviseSnapshot({ seed: _u.randomSeed() })
                                    this.growlAlert(`Random seed is now ${this.subcalc.snapshot.seed}.`, 'success', 'New Random Coin')
                                    this.keySuffix = String(_u.randomSeed())
                                    this.forceUpdate()
                                }}
                            />
                            : ''
                        }
                    </div>
                </div>
                {this.renderSummary()}
            </div>
        )
    }

    /**
     * Returns the JSX for the footer elements of the app.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderByline = (): JSX.Element => {
        return (
            <Button id="app-byline"
                label="Brought to you by Tenseg LLC"
                href="https://tenseg.net"
                onClick={() => this.addCardState(CardFor.ShowingBy)}
            />
        )
    }

    /**
     * Returns the JSX for debugging elements. These should not be
     * displayed when compiled for production.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderDebuggingInfo = (): JSX.Element => {

        if (!_u.isDebugging()) return <></>

        return (
            <div key={_u.randomSeed()} className="debugging">
                <p>This is debugging info for <a href="https://grand.clst.org:3000/tenseg/subcalc-pr/issues" target="_repository">subcalc-pr</a> (with <a href="https://reactjs.org/docs/react-component.html" target="_react">ReactJS</a>, <a href="https://www.primefaces.org/primereact/" target="_primereact">PrimeReact</a>, <a href="https://www.primefaces.org/primeng/#/icons" target="_primeicons">PrimeIcons</a>) derrived from <a href="https://bitbucket.org/tenseg/subcalc-js/src" target="_bitbucket">subcalc-js</a>.
                </p>
                <pre>{this.subcalc.snapshot.asText()}</pre>
                <div className="columns">
                    <div className="column">
                        <pre>{"rendered App " + (new Date()).toLocaleTimeString()}</pre>
                        <pre>{"app: " + JSON.stringify(_u.getApp())}</pre>
                        <pre>{"subcalc: " + this.subcalc.debug()}</pre>
                        <ShowJSON name="this.state" data={this.state} /><br />
                    </div>
                    <div className="column">
                        <ShowJSON name="this.subcalc" data={this.subcalc} />
                    </div>
                </div>
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

        _u.debug("rendering", this.subcalc.snapshot)

        return (
            <div id="app">
                <div id="app-content">
                    {this.state.present == Presenting.Calculator
                        ? this.renderCalculator()
                        : ''}
                    {this.state.present == Presenting.Loading
                        ? <Loader
                            subcalc={this.subcalc}
                            onLoad={this.loadSnapshot}
                            onNew={this.newMeeting}
                        />
                        : ''}
                    {this.renderByline()}
                    {this.renderNextCard()}
                    <Growl ref={(el) => this.growl = el} />
                </div>
                {this.renderDebuggingInfo()}
            </div>
        )
    }
}
