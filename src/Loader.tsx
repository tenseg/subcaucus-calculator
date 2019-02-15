/**
 * Loader.tsx
 *
 * A ReactJS component that presents the snapshot loader.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// see https://github.com/ClickSimply/typescript-map
import { TSMap } from 'typescript-map'

// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { Menubar } from 'primereact/menubar'
import { Accordion, AccordionTab } from 'primereact/accordion';

// local to this app
import * as _u from './Utilities'
import { SubCalc } from './SubCalc'
import { Snapshot } from './Snapshot'
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
 * Properties for the snapshot loader.
 */
interface Props {
    subcalc: SubCalc
    onLoad: ((snapshot?: Snapshot) => void)
    onNew: (() => void)
}

/**
 * State for the snapshot loader.
 */
interface State {
    sortBy: 'name' | 'date'
    showing: 'saved' | 'trashed'
}

/**
 * A ReactJS component that presents the snapshot loader.
 */
export class Loader extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {
            sortBy: "date",
            showing: "saved"
        }
    }

    /**
     * Returns JSX for the menubar.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderMenu = (): JSX.Element => {
        const items: any = []
        items.push({
            label: "Back to the calculator",
            icon: "fa fa-fw fa-chevron-left",
            command: () => this.props.onLoad()
        })
        return <Menubar key="loader-menu" model={items} id="app-main-menu" />
    }

    /**
     * Returns an icon to represent the button.
     */
    sortOrderIcon = (button: 'name' | 'date'): string => {
        return button === 'name'
            ? this.state.sortBy === "name"
                ? "fa fa-fw fa-chevron-circle-up"
                : "fa fa-fw fa-chevron-circle-off"
            : this.state.sortBy === "date"
                ? "fa fa-fw fa-chevron-circle-down"
                : "fa fa-fw fa-chevron-circle-off"
    }

    /**
     * Toggle between name and date sorting.
     */
    toggleSortOrder = () => {
        this.setState({
            sortBy: this.state.sortBy === "name"
                ? "date"
                : "name"
        })
    }

    /**
     * Move a snapshot to the trash.
     */
    deleteSnapshot = (snapshot: Snapshot) => {
        this.props.subcalc.trashSnapshot(snapshot)
        this.forceUpdate()
    }

    /**
     * Render JSX for a single snapshot.
     */
    renderSnapshot = (snapshot: Snapshot): JSX.Element => {
        const created = new Date(Date.parse(snapshot.created))
        const createdDate = created.toLocaleString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        })
        const revised = new Date(Date.parse(snapshot.revised))
        const revisedDate = revised.toLocaleString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
        })
        const revisedString = createdDate === revisedDate
            ? revised.toLocaleString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
                second: undefined,
            })
            : revised.toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: undefined,
            })

        return (
            <div key={`loader-snapshot-${snapshot.revised}-${snapshot.device}`} className={`loader-snapshot`}>
                <div className="loader-snapshot-button button"
                    onClick={() => this.props.onLoad(snapshot)}
                >
                    <div className="loader-snapshot-revised">
                        {revisedString}
                    </div>
                    <div className="loader-snapshot-name">
                        <span className={"far fa-fw fa-clock"}>&nbsp;</span>
                        {snapshot.revision}
                    </div>
                </div>
                {this.state.showing === "saved"
                    ? <div className="loader-snapshot-actions">
                        <Button
                            icon="fa fa-fw fa-trash"
                            className="p-button loader-snapshot-trash-button"
                            onClick={() => this.deleteSnapshot(snapshot)}
                        />
                    </div>
                    : <div className="loader-snapshot-actions">
                        <Button
                            icon="fa fa-fw fa-trash-restor"
                            className="p-button loader-snapshot-fake-button"
                            disabled={true}
                        />
                    </div>

                }
            </div>
        )
    }

    /**
     * Render JSX for a TSMap of snapshots.
     */
    renderSnapshots = (snapshots: TSMap<string, Snapshot>): JSX.Element => {
        return (
            <>
                {snapshots.map((snapshot) => {
                    return this.renderSnapshot(snapshot)
                })}
            </>
        )
    }

    /**
     * A method to sort snapshots by date.
     */
    sortBySnapshotRevision = (a: Snapshot, b: Snapshot): number => {
        let comparison = 0
        const revA = `${a.created} ${a.device} ${a.revised}`
        const revB = `${b.created} ${b.device} ${b.revised}`
        if (revA < revB) {
            comparison = 1;
        }
        if (revA > revB) {
            comparison = -1;
        }
        return comparison
    }

    /**
     * A method to sort snapshots by name.
     */
    sortBySnapshotName = (a: Snapshot, b: Snapshot): number => {
        const revA = `${a.name} ${a.created} ${a.device} ${a.revision}`
        const revB = `${b.name} ${b.created} ${b.device} ${b.revision}`
        return revA.localeCompare(revB, undefined, { sensitivity: 'base', numeric: true })
    }

    /**
     * Render JSX for a whole meeting and its snapshots.
     */
    renderMeeting = (snapshots: Array<Snapshot>): JSX.Element => {
        const snap = snapshots[0]
        const snapshotsJSX = snapshots.map((snapshot) => this.renderSnapshot(snapshot))

        const created = new Date(Date.parse(snap.created))
        const createdDate = created.toLocaleString(undefined, {
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            second: undefined,
        })

        return (
            <AccordionTab key={`loader-meeting-${snap.meetingKey()} ${this.state.sortBy} ${this.state.showing}`}
                headerClassName={`loader-meeting-accordion-header ${this.state.showing}`}
                contentClassName="loader-meeting-accordion-content"
                header={
                    <div className={`loader-meeting-header`}>
                        <div className="loader-meeting-name">{snap.name}</div>
                        <div className="loader-meeting-timestamp">{createdDate}</div>
                    </div>
                }
            >
                {snapshotsJSX}
            </AccordionTab>
        )

    }

    /**
     * Render JSX for a list of all meetings.
     */
    renderMeetings = (): JSX.Element => {
        const snapshots = this.props.subcalc.snapshots(this.state.showing)

        if (snapshots.length === 0) {
            return this.state.showing === "saved"
                ? <ValueCard key="nothing-to-load"
                    title="No snapshots yet"
                    description="You will have to save a snapshot before you can open one!"
                    footer={
                        <Button key="nothing-to-load-button"
                            label="OK"
                            icon="fa fa-fw fa-check"
                            onClick={() => this.props.onLoad()}
                        />
                    }
                />
                : <ValueCard key="nothing-to-load"
                    title="Nothing in the trash"
                    description="The trash is empty."
                    footer={
                        <Button key="nothing-to-load-button"
                            label="OK"
                            icon="fa fa-fw fa-check"
                            onClick={() => this.setState({ showing: "saved" })}
                        />
                    }
                />
        }

        const currentMeetingKey = this.props.subcalc.snapshot.meetingKey()

        // loop thought the snapshots, sorting them and splitting them
        // into meetings and creating a JSX array to return
        let tabs: Array<JSX.Element> = []
        let meetingKey = ""
        let meetingIndex = 0
        let indexOfCurrent = 0
        let meetingSnapshots: Array<Snapshot> = []
        const sort = this.state.sortBy === "name"
            ? this.sortBySnapshotName
            : this.sortBySnapshotRevision

        snapshots.sort(sort).forEach((snapshot) => {
            if (meetingKey !== snapshot.meetingKey()) {
                meetingKey = snapshot.meetingKey()
                if (meetingKey === currentMeetingKey) {
                    indexOfCurrent = meetingIndex
                }
                meetingIndex++
                if (meetingSnapshots.length > 0) {
                    tabs.push(this.renderMeeting(meetingSnapshots))
                }
                meetingSnapshots = []
            }
            meetingSnapshots.push(snapshot)
        })

        tabs.push(this.renderMeeting(meetingSnapshots))

        return (
            <div key={`loader-meetings`} className="loader-meetings">
                <Accordion key={`${this.state.sortBy}`}
                    activeIndex={indexOfCurrent}
                >
                    {tabs}
                </Accordion>
            </div>
        )
    }

    /**
     * Render JSX for this component.
     */
    render() {
        return (
            <div className="loader">
                {this.renderMenu()}
                <div id="meeting-info">
                    <div id="meeting-name" className="not-button">
                        Pick a snapshot below to open it...
                    </div>
                </div>
                <div id="loader-container">
                    <div id="loader-header">
                        <Button id="loader-name-head"
                            label="Name"
                            icon={this.sortOrderIcon("name")}
                            onClick={() => this.toggleSortOrder()}
                        />
                        <Button id="loader-timestamp-head"
                            label="Last Revised"
                            iconPos="right"
                            icon={this.sortOrderIcon("date")}
                            onClick={() => this.toggleSortOrder()}
                        />
                    </div>
                    {this.renderMeetings()}
                    <div id="subcaucus-footer">
                        {this.state.showing === 'saved'
                            ? <Button id="add-meeting-button"
                                label="Add new meeting"
                                icon="fa fa-fw fa-calendar-plus"
                                onClick={() => this.props.onNew()}
                            />
                            : <Button id="empty-trash-button"
                                label="Empty trash"
                                icon="fa fa-fw fa-trash"
                                onClick={() => {
                                    this.props.subcalc.emptyTrash()
                                    this.setState({ showing: "saved" })
                                }}
                            />
                        }
                        {this.state.showing === 'saved'
                            ? <Button id="show-trashed-button"
                                label="Show trash"
                                icon="fa fa-fw fa-trash"
                                className="p-button-secondary"
                                onClick={() => this.setState({ showing: "trashed" })}
                            />
                            : <Button id="show-saved-button"
                                label="Show saved"
                                icon="fa fa-fw fa-calendar"
                                className="p-button-secondary"
                                onClick={() => this.setState({ showing: "saved" })}
                            />
                        }
                        <Button id="cancel-loader-button"
                            label="Cancel"
                            icon="fa fa-fw fa-times"
                            className="p-button-secondary"
                            onClick={() => this.props.onLoad()}
                        />
                    </div>
                </div>
            </div>
        )
    }
}
