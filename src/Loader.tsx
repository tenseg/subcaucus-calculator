import * as React from 'react'
// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { Menubar } from 'primereact/menubar'
import { Accordion, AccordionTab } from 'primereact/accordion';
// local to this app
import * as _u from './Utilities'
import { SubCalcStorage } from './SubCalcStorage'

/**
 * Facilitates sorting up or down (or not at all), as needed.
 */
enum SortOrder {
    Descending = -1,
    None = 0,
    Ascending = 1,
}

interface Props {
    storage: SubCalcStorage
    currentMeetingKey: string
    onLoad: ((snapshot?: MeetingSnapshot) => void)
}
interface State {
}

export class Loader extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {
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
                label: "Back to the calculator",
                icon: "pi pi-fw pi-caret-left",
                command: () => this.props.onLoad()
            }
        ]
        return <Menubar key="loader-menu" model={items} id="app-main-menu" />
    }

    /**
     * Returns an icon to represent the supplied `SortOrder`.
     */
    sortOrderIcon = (order: SortOrder): string => {
        return ["pi pi-chevron-circle-down", "pi pi-circle-off", "pi pi-chevron-circle-up"][order + 1]
    }

    renderSnapshot = (snapshot: MeetingSnapshot): JSX.Element => {
        const descriptor = snapshot.revision ? "snapshot" : "meeting"
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
            <div key={`loader-snapshot-${snapshot.revised}-${snapshot.author}`} className={`loader-snapshot ${descriptor}`}>
                <div className="loader-snapshot-button button"
                    onClick={() => { this.props.onLoad(snapshot) }}
                >
                    <div className="loader-snapshot-revised">
                        {revisedString}
                    </div>
                    <div className="loader-snapshot-name">
                        <span className={"pi " + (snapshot.revision ? "pi-clock" : "pi-calendar")}>&nbsp;</span>
                        {snapshot.revision || "As it was last edited"}
                    </div>
                </div>
                <div className="loader-snapshot-actions">
                    <Button
                        icon="pi pi-trash"
                        onClick={() => { _u.debug(`TODO Delete ${descriptor}`) }}
                    />
                </div>
            </div>
        )
    }

    renderSnapshots = (snapshots: SnapshotMap): JSX.Element => {
        return (
            <>
                {snapshots.map(this.renderSnapshot)}
            </>
        )
    }

    renderMeetings = (): JSX.Element => {
        const meetings = this.props.storage.meetings

        let indexOfCurrent = 0
        const meetingRows: Array<JSX.Element> = meetings.map((meeting, key, index) => {

            if (this.props.currentMeetingKey == key) {
                indexOfCurrent = index || 0
                console.log("indexOfCurrent", indexOfCurrent, "index", index, "key", key)
            }
            const meetingKey = `${meeting.created}-${meeting.author}`
            const hasSnapshots = meeting.snapshots.length > 0

            const created = new Date(Date.parse(meeting.created))
            const createdDate = created.toLocaleString(undefined, {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                second: undefined,
            })

            return <AccordionTab key={`loader-meeting-${meetingKey}`}
                headerClassName="loader-meeting-accordion-header"
                contentClassName="loader-meeting-accordion-content"
                header={
                    <div className="loader-meeting-header">
                        <div className="loader-meeting-name">{meeting.current.name}</div>
                        <div className="loader-meeting-timestamp">{createdDate}</div>
                    </div>
                }
            >
                {this.renderSnapshot(meeting.current)}
                {hasSnapshots ? this.renderSnapshots(meeting.snapshots) : ""}
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
                        Pick a meeting below to load it...
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
