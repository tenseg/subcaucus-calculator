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

interface Props {
    subcalc: SubCalc
    onLoad: ((snapshot?: Snapshot) => void)
    onNew: (() => void)
}
interface State {
    sortBy: 'name' | 'date'
}

export class Loader extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {
            sortBy: "date"
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
            icon: "pi pi-fw pi-caret-left",
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
                ? "pi pi-chevron-circle-up"
                : "pi pi-chevron-circle-off"
            : this.state.sortBy === "date"
                ? "pi pi-chevron-circle-down"
                : "pi pi-chevron-circle-off"
    }

    toggleSortOrder = () => {
        this.setState({
            sortBy: this.state.sortBy === "name"
                ? "date"
                : "name"
        })
    }

    deleteSnapshot = (snapshot: Snapshot) => {
        this.props.subcalc.deleteSnapshot(snapshot)
        this.forceUpdate
    }

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
            <div key={`loader-snapshot-${snapshot.revised}-${snapshot.author}`} className={`loader-snapshot`}>
                <div className="loader-snapshot-button button"
                    onClick={() => this.props.onLoad(snapshot)}
                >
                    <div className="loader-snapshot-revised">
                        {revisedString}
                    </div>
                    <div className="loader-snapshot-name">
                        <span className={"pi pi-clock"}>&nbsp;</span>
                        {snapshot.revision}
                    </div>
                </div>
                <div className="loader-snapshot-actions">
                    <Button
                        icon="pi pi-trash"
                        className="p-button-danger"
                        onClick={() => this.deleteSnapshot(snapshot)}
                    />
                </div>
            </div>
        )
    }

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
        const revA = `${a.created} ${a.author} ${a.revised}`
        const revB = `${b.created} ${b.author} ${b.revised}`
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
        let comparison = 0
        const revA = `${a.name} ${a.created} ${a.author} ${a.revision}`.toUpperCase()
        const revB = `${b.name} ${b.created} ${b.author} ${b.revision}`.toUpperCase()
        if (revA < revB) {
            comparison = -1;
        }
        if (revA > revB) {
            comparison = 1;
        }
        return comparison
    }

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
            <AccordionTab key={`loader-meeting-${snap.meetingKey()} ${this.state.sortBy}`}
                headerClassName="loader-meeting-accordion-header"
                contentClassName="loader-meeting-accordion-content"
                header={
                    <div className="loader-meeting-header">
                        <div className="loader-meeting-name">{snap.name}</div>
                        <div className="loader-meeting-timestamp">{createdDate}</div>
                    </div>
                }
            >
                {snapshotsJSX}
            </AccordionTab>
        )

    }

    renderMeetings = (): JSX.Element => {
        const snapshots = this.props.subcalc.snapshots()

        if (snapshots.length === 0) {
            return (
                <ValueCard key="nothing-to-load"
                    title="No snapshots yet"
                    description="You will have to save a snapshot before you can open one!"
                    footer={
                        <Button key="nothing-to-load-button"
                            label="OK"
                            icon="pi pi-check"
                            onClick={() => this.props.onLoad()}
                        />
                    }
                />
            )
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
                        <Button id="add-loader-button"
                            label="Add new meeting"
                            icon="pi pi-calendar-plus"
                            onClick={() => this.props.onNew()}
                        />
                        <Button id="cancel-loader-button"
                            label="Cancel"
                            icon="pi pi-times"
                            className="p-button-secondary"
                            onClick={() => this.props.onLoad()}
                        />
                    </div>
                </div>
            </div>
        )
    }
}
