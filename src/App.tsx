/** 
 * App.tsx
 *
 * A ReactJS component that presents the Subcaucus Calculator.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { Menubar } from 'primereact/menubar'
import { Growl } from 'primereact/growl'
import 'primereact/resources/primereact.min.css'
import 'primereact/resources/themes/nova-light/theme.css'
import 'primeicons/primeicons.css'
import '@fortawesome/fontawesome-free/css/all.css';


// local to this app
import './App.scss'
import * as _u from './Utilities'
import { SubCalc } from './SubCalc'
import { Snapshot } from './Snapshot'
import { Subcaucus } from './Subcaucus'
import { SubcaucusRow, SubcaucusRowAction } from './SubcaucusRow'
import { Loader } from './Loader'
import { Analyzer } from './Analyzer'
import { ShowJSON } from './ShowJSON'

// cards
import { RemovingEmptiesCard } from './Cards/RemovingEmptiesCard';
import { ChangingCoinCard } from './Cards/ChangingCoinCard';
import { ChangingDelegatesAllowedCard } from './Cards/ChangingDelegatesAllowedCard';
import { ChangingNameCard } from './Cards/ChangingNameCard';
import { SavingSnapshotCard } from './Cards/SavingSnapshotCard';
import { SavingSnapshotBeforeCard } from './Cards/SavingSnapshotBeforeCard';
import { WelcomeCard } from './Cards/WelcomeCard';
import { InstructionsCard } from './Cards/InstructionsCard';
import { AboutCard } from './Cards/AboutCard';
import { CreditCard } from './Cards/CreditCard';
import { SecurityCard } from './Cards/SecurityCard';
import { ViabilityCard } from './Cards/ViabilityCard';
import { PasteCard } from './Cards/PasteCard';
import { ParticipantsCard } from './Cards/ParticipantsCard';

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
    Welcome,
    ChangingName,
    ChangingDelegates,
    ChangingCoin,
    SavingSnapshot,
    SavingSnapshotBefore,
    RemovingEmpties,
    Participants,
    ShowingAbout,
    ShowingBy,
    ShowingInstructions,
    ShowingSecurity,
    Viability,
    Pasting,
}

/**
 * Used to represent which "screen" of the app we should
 * be rendering.
 */
enum Presenting {
    Calculator,
    Loading,
    Analyzing,
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

/**
 * No properites for the app.
 */
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
    sortName: _u.SortOrder
    sortCount: _u.SortOrder
    hideDelegates: boolean
}

/**
 * A ReactJS component that presents the Subcaucus Calculator..
 */
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
        CardFor.ChangingName,
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

        // if there was some kind of upgrade, make sure the user gets a welcome
        if (this.subcalc.upgrade) {
            cards = [CardFor.Welcome]
        }

        // complete the loading of incoming (query) data,
        // but warn before overwriting unsaved changes
        if (this.subcalc.incoming.length > 0) {
            if (this.subcalc.snapshot.revision === '') {
                cards = [CardFor.SavingSnapshotBefore]
                before = "Before importing data..."
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
            sortName: _u.SortOrder.None,
            sortCount: _u.SortOrder.None,
            hideDelegates: false,
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

    /**
     * Prepare and ship an email summarizing this snapshot
     * to the default email app for this device.
     */
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
     * Prepare and ship an email soliciting feedback
     * to the default email app for this device.
     */
    emailFeedback = () => {
        const snapshot = this.subcalc.snapshot

        const url = snapshot.asURL()

        let body = "Feel free to send whatever feedback you like. We have found that answering the following questions often helps us better understand requests. Thank you for using the subcaucus calculator and for caring enough to ask us to make it better!\n\nWhat were you trying to do?\n\nWhat action did you take to accomplish this goal?\n\nWhat did you expect to happen?\n\nWhat actually happened instead?"

        body += "\n\nInclude the odd looking information below if you want us to be able to help you with a question or problem. Thanks!\n\n"
            + url + "\n\n"
            + navigator.platform + " "
            + navigator.userAgent + "\n"

        const app = _u.getApp()
        body += `\nSubCalc version ${app.version} ${app.build}\n`

        let subject = `SubCalc Feedback`;

        const mailto = "mailto:subcalc@tenseg.net?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body)

        location.href = mailto
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
    sortOrderIcon = (order: _u.SortOrder): string => {
        return ["fa fa-chevron-circle-down", "far fa-circle", "fa fa-chevron-circle-up"][order + 1]
    }

    /**
     * Cycles through the sort orders and returns the next one.
     */
    nextSortOrder = (currentOrder: _u.SortOrder, direction = 1): _u.SortOrder => {
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
        const { app } = _u.getApp()
        const items = [
            {
                label: "About",
                icon: "fa fa-fw fa-info-circle",
                items: [
                    {
                        label: "Minnesota DFL Subcaucus Calculator",
                        icon: "fa fa-fw fa-democrat",
                        command: () => this.addCardState(CardFor.ShowingAbout),
                    },
                    {
                        label: "Instructions",
                        icon: "fa fa-fw fa-question-circle",
                        command: () => this.addCardState(CardFor.ShowingInstructions),
                    },
                    {
                        label: "Data Security",
                        icon: "fa fa-fw fa-shield-alt",
                        command: () => this.addCardState(CardFor.ShowingSecurity),
                    },
                    {
                        label: "Feedback",
                        icon: "fa fa-fw fa-comment",
                        command: this.emailFeedback
                    },
                ]
            },
            {
                label: "Meetings",
                icon: "fa fa-fw fa-calendar-alt",
                items: [
                    {
                        label: "New meeting",
                        icon: "fa fa-fw fa-calendar-plus",
                        command: () => this.checkForRevisionBefore(this.newMeeting, "Before creating a new meeting...")
                    },
                    {
                        label: "Open snapshot",
                        icon: "fa fa-fw fa-folder-open",
                        command: () => this.checkForRevisionBefore(() => this.setState({ present: Presenting.Loading }), "Before opening a snapshot...")
                    },
                    {
                        label: this.subcalc.snapshot.revision ? "Rename snapshot" : "Save snapshot",
                        icon: "fa fa-fw fa-clock",
                        command: () => this.addCardState(CardFor.SavingSnapshot),
                    },
                    {
                        label: "Duplicate meeting",
                        icon: "fa fa-fw fa-clone",
                        command: () => this.checkForRevisionBefore(this.duplicateMeeting, "Before duplicating the meeting...")
                    },
                    {
                        label: "Coin settings",
                        icon: "fa fa-fw fa-cog",
                        command: () => this.addCardState(CardFor.ChangingCoin)
                    },
                ]
            },
            {
                label: "Share",
                icon: "fa fa-fw fa-share-alt",
                items: [
                    {
                        label: "Email report",
                        icon: "fa fa-fw fa-envelope",
                        command: this.emailSnapshot
                    },
                    {
                        label: "Text document",
                        icon: "fa fa-fw fa-file-alt",
                        disabled: app === 'standalone',
                        command: () => {
                            if (_u.isApp()) {
                                location.href = "subcalc://share-text/" + encodeURIComponent(this.subcalc.snapshot.asText())
                            } else {
                                _u.download(this.subcalc.snapshot.asText(), 'subcalc.txt')
                            }
                        }
                    },
                    {
                        label: "CSV spreadsheet",
                        icon: "fa fa-fw fa-file-csv",
                        disabled: app === 'standalone',
                        command: () => {
                            if (_u.isApp()) {
                                location.href = "subcalc://share-csv/" + encodeURIComponent(this.subcalc.snapshot.asCSV()) + "?filename=subcalc"
                            } else {
                                _u.download(this.subcalc.snapshot.asCSV(), 'subcalc.csv', 'text/csv')
                            }
                        }
                    },
                    {
                        label: "JSON code",
                        icon: "fa fa-fw fa-file-code",
                        disabled: app === 'standalone',
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
                        label: "Link",
                        icon: "fa fa-fw fa-link",
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
                    {
                        label: "Paste clipboard",
                        icon: "fa fa-fw fa-clipboard",
                        command: () => {
                            if (_u.isApp()) {
                                // will reload the app with the clipboard content
                                location.href = "subcalc://get-clipboard/"
                            } else {
                                this.addCardState(CardFor.Pasting)
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
     * cases in this function. Do not `setState()` in this method,
     * although you can do so within the callbacks.
     */
    renderNextCard = (): JSX.Element => {
        return this.state.cards.sort((a, b) => b - a).reduce((accumulator: JSX.Element, cardFor: CardFor): JSX.Element => {
            _u.debug(`filtering card for ${cardFor}`, accumulator)
            switch (cardFor) {
                case CardFor.Welcome: return <WelcomeCard
                    name={this.subcalc.snapshot.name}
                    upgrade={this.subcalc.upgrade}
                    save={() => this.removeCardState(CardFor.Welcome)}
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
                    meetingName={this.subcalc.snapshot.name}
                    revisionName={this.subcalc.snapshot.revision}
                    save={this.saveSnapshotBefore}
                    title={this.state.before}
                />
                case CardFor.SavingSnapshot: return <SavingSnapshotCard
                    meetingName={this.subcalc.snapshot.name}
                    revisionName={this.subcalc.snapshot.revision}
                    save={this.saveSnapshot}
                />
                case CardFor.ChangingName: return <ChangingNameCard
                    name={this.subcalc.snapshot.name}
                    defaultName={this.subcalc.snapshot.defaultName()}
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
                        location.href = "/"
                    }}
                />
                case CardFor.Participants: return <ParticipantsCard
                    cancel={() => this.removeCardState(CardFor.Participants)}
                    clear={() => {
                        this.removeCardState(CardFor.Participants)
                        this.checkForRevisionBefore(() => {
                            this.subcalc.zeroSubcaucuses()
                            this.keySuffix = String(_u.randomSeed())
                            this.forceUpdate()
                        }, "Before zeroing out the subcaucuses...")
                    }}
                    analyze={() => {
                        this.removeCardState(CardFor.Participants)
                        this.setState({ present: Presenting.Analyzing })
                    }}
                />
                case CardFor.Viability: return <ViabilityCard
                    save={() => this.removeCardState(CardFor.Viability)}
                    snapshot={this.subcalc.snapshot}
                />
                case CardFor.Pasting: return <PasteCard
                    save={(value?: string) => {
                        this.removeCardState(CardFor.Pasting)
                        if (value) {
                            this.growlAlert(value, 'success', 'Received')
                            const url = new URL(value)
                            window.location.search = url.search
                        } else {
                            this.growlAlert(`Failed to get anything from the clipboard.`, 'error', 'Nothing received!')
                        }
                    }}
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
                _u.switchHistory()
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
            this.setState({ cards: this.removeCard(CardFor.Welcome, this.removeCard(CardFor.ChangingName)) })
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
     * Returns JSX for the subcaucus rows.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderSubcaucusRows = (): JSX.Element[] => {
        // sort subcaucuses by id number by default
        this.subcalc.snapshot.sortBy = 'id'
        this.subcalc.snapshot.sortOrder = _u.SortOrder.Ascending

        if (this.state.sortName != _u.SortOrder.None) {
            this.subcalc.snapshot.sortBy = 'name'
            this.subcalc.snapshot.sortOrder = this.state.sortName
        }

        if (this.state.sortCount != _u.SortOrder.None) {
            this.subcalc.snapshot.sortBy = 'count'
            this.subcalc.snapshot.sortOrder = this.state.sortCount
        }

        return this.subcalc.snapshot.subcaucusesSorted().map((subcaucus, index, array): JSX.Element => {
            return (
                <SubcaucusRow key={`${subcaucus.id} ${this.keySuffix}`}
                    subcaucus={subcaucus}
                    hideDelegates={this.state.hideDelegates}
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
            ? <section id="summary-container"
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
                                {(this.subcalc.snapshot.participants - this.subcalc.snapshot.viableParticipants).singularPlural("person", "people")} in {this.subcalc.snapshot.nonViableSubcaucuses.singularPlural("a non-viable subcaucus", "non-viable subcaucuses", "no number")}
                            </div>
                        </div>
                        : ''
                }
            </section >
            : <section id="summary-container">
                <div className="summary-row">
                    <div className="summary-label">
                        To calculate an initial "viability number," put a count all participants into a single subcaucus.
                    </div>
                </div>
            </section>
        )
    }

    /**
     * Returns JSX for the whole calculator.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderCalculator = (): JSX.Element => {
        const { sortName, sortCount, hideDelegates } = this.state
        const snapshot = this.subcalc.snapshot
        const { name, revision } = snapshot

        const allEmpty = snapshot.subcaucuses.values().findIndex((s) => s.count > 0) === -1
        const noEmpties = snapshot.subcaucuses.values().findIndex((s) => s.count === 0) === -1

        return (
            <div id="calculator">
                <nav>
                    {this.renderMenu()}
                </nav>
                <main>
                    <section id="meeting-info">
                        <h1 id="meeting-name" className="button"
                            onClick={() => this.addCardState(CardFor.ChangingName)}
                        >
                            {name ? name : this.subcalc.snapshot.defaultName()}
                            {revision != ''
                                ? <span className="snapshot">
                                    {revision}
                                </span>
                                : ''
                            }
                        </h1>
                        <div id="delegates-allowed" className="button"
                            onClick={() => this.addCardState(CardFor.ChangingDelegates)}
                        >{this.allowedString()}</div>
                    </section>
                    <section id="subcaucus-container">
                        <div id="subcaucus-header">
                            <Button id="subcaucus-name-head"
                                label="Subcaucuses"
                                icon={this.sortOrderIcon(sortName)}
                                onClick={() => this.setState({
                                    sortName: this.state.sortName ? _u.SortOrder.None : _u.SortOrder.Ascending,
                                    sortCount: _u.SortOrder.None
                                })}
                            />
                            <Button id="subcaucus-count-head"
                                label="Members"
                                iconPos="right"
                                icon={this.sortOrderIcon(sortCount)}
                                onClick={() => this.setState({
                                    sortName: _u.SortOrder.None,
                                    sortCount: this.nextSortOrder(sortCount, -1)
                                })}
                            />
                            <Button id="subcaucus-delegate-head"
                                label="Dels"
                                iconPos="right"
                                icon={hideDelegates ? "fa fa-fw fa-eye-slash" : "fa fa-fw fa-eye"}
                                onClick={() => this.setState({ hideDelegates: !hideDelegates })}
                            />
                        </div>
                        <div id="subcaucus-list">
                            {this.renderSubcaucusRows()}
                        </div>
                        <div id="subcaucus-footer">
                            <Button id="add-subcaucus-button"
                                label="Add Subcaucus"
                                icon="fa fa-fw fa-plus"
                                onClick={() => {
                                    snapshot.addSubcaucus()
                                    this.setStateSubcaucuses()
                                }}
                            />
                            <Button id="remove-empty-subcaucuses-button"
                                label="Empties"
                                icon="fa fa-fw fa-trash"
                                disabled={noEmpties}
                                tooltip="Remove subcaucuses that have no members"
                                tooltipOptions={this.tooltipOptions}
                                onClick={() => this.addCardState(CardFor.RemovingEmpties)}
                            />
                            <Button id="participants-button"
                                aria-label="Participants"
                                icon="fa fa-fw fa-user"
                                disabled={allEmpty}
                                tooltip="Participants"
                                tooltipOptions={this.tooltipOptions}
                                onClick={() => this.addCardState(CardFor.Participants)}
                            />
                            {_u.isDebugging()
                                ? <>
                                    <Button id="random-coin-button"
                                        aria-label="New random coin"
                                        icon="fa fa-fw fa-sync-alt"
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
                                    <Button id="analysis-button"
                                        aria-label="Show Analysis"
                                        icon="fa fa-fw fa-chart-pie"
                                        className="p-button-success"
                                        tooltip="Show analysis"
                                        tooltipOptions={this.tooltipOptions}
                                        onClick={() => {
                                            this.setState({ present: Presenting.Analyzing })
                                        }}
                                    />
                                </>
                                : ''
                            }
                        </div>
                    </section>
                    {this.renderSummary()}
                </main>
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
            <footer>
                <Button id="app-byline"
                    label="Brought to you by Tenseg LLC"
                    href="https://tenseg.net"
                    onClick={() => this.addCardState(CardFor.ShowingBy)}
                />
                <div id="app-version">version {process.env.REACT_APP_VERSION}{process.env.REACT_APP_IOS_VERSION ? ' iOS' : ''}</div>
            </footer>
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

        const app = _u.getApp()

        return (
            <aside key={_u.randomSeed()} className="debugging">
                <p>This is debugging info for <a href="https://github.com/tenseg/subcaucus-calculator/issues" target="_repository">subcaucus-calculator</a> (with <a href="https://reactjs.org/docs/react-component.html" target="_react">ReactJS</a>, <a href="https://www.primefaces.org/primereact/" target="_primereact">PrimeReact</a>, <a href="https://fontawesome.com/icons?d=gallery&s=solid&m=free" target="_fontawesome">Font Awesome</a>) derrived from <a href="https://bitbucket.org/tenseg/subcalc-js/src" target="_bitbucket">subcalc-js</a>. ({app.app || 'web'} {app.version})
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
                <pre>{JSON.stringify(process.env, null, 2)}</pre>
                <p style={{ clear: "both" }}>Done.</p>
            </aside>
        )
    }

    /**
     * Shows an alert using PrimeReact `Growl` if it is available,
     * or simply as an alert if there is not growl instance yet.
     */
    growlAlert = (message: string, severity: 'error' | 'warn' | 'success' | 'info' = 'error', summary: string = '', sticky?: 'sticky') => {
        if (this.growl) {
            if (!summary && message) {
                summary = message
                message = ''
            }
            this.growl.show({
                severity: severity,
                summary: summary,
                closable: sticky === 'sticky',
                detail: message,
                sticky: sticky === 'sticky',
            });
        } else {
            alert((summary ? `${summary}: ` : '') + message)
        }
    }

    /**
     * Returns the JSX for the whole SubCalc App.
     */
    render() {

        _u.debug("rendering", this.subcalc.snapshot)
        _u.debug(`rendering app history length ${history.length}`, history)
        _u.debug(`rendering app with history state`, history.state)

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
                    {this.state.present == Presenting.Analyzing
                        ? <Analyzer
                            snapshot={this.subcalc.snapshot}
                            onExit={() => this.setState({ present: Presenting.Calculator })}
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
