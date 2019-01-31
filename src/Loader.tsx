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
interface State { }

export class Loader extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {}
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
     * Returns an icon to represent the supplied `SortOrder`.
     */
    sortOrderIcon = (order: SortOrder): string => {
        return ["pi pi-chevron-circle-down", "pi pi-circle-off", "pi pi-chevron-circle-up"][order + 1]
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

    renderMeetings = (): JSX.Element => {
        const meetings = this.props.subcalc.meetings

        let indexOfCurrent = 0
        const meetingRows: Array<JSX.Element> = meetings.map((meeting, key, index) => {

            const created = new Date(Date.parse(meeting.created))
            const createdDate = created.toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: undefined,
            })

            return <AccordionTab key={`loader-meeting-${meeting.key}`}
                headerClassName="loader-meeting-accordion-header"
                contentClassName="loader-meeting-accordion-content"
                header={
                    <div className="loader-meeting-header">
                        <div className="loader-meeting-name">{meeting.name}</div>
                        <div className="loader-meeting-timestamp">{createdDate}</div>
                    </div>
                }
            >
                {this.renderSnapshots(meeting.snapshots)}
            </AccordionTab>
        })

        return (
            <div key={`loader-meetings`} className="loader-meetings">
                <Accordion activeIndex={indexOfCurrent}>
                    {meetingRows}
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
                        Pick a snapshot below to load it...
                    </div>
                </div>
                <div id="loader-container">
                    <div id="loader-header">
                        <Button id="loader-name-head"
                            label="Name"
                            icon={this.sortOrderIcon(0)}
                        />
                        <Button id="loader-timestamp-head"
                            label="Last Revised"
                            iconPos="right"
                            icon={this.sortOrderIcon(0)}
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
