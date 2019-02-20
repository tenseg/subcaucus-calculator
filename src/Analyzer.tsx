/**
 * Analyzer.tsx
 *
 * A ReactJS component that presents an analysis of a snapshot.
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
import { Chart } from 'primereact/chart';

// local to this app
import * as _u from './Utilities'
import { Snapshot } from './Snapshot'

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
    snapshot: Snapshot
    onExit: (() => void)
}

/**
 * State for the snapshot loader.
 */
interface State {
    sortBy: 'words' | 'counts'
}

/**
 * A ReactJS component that presents the snapshot loader.
 */
export class Analyzer extends React.Component<Props, State> {

    constructor(props: Props) {
        super(props)
        this.state = {
            sortBy: "counts",
        }
    }

    /**
     * Returns an icon to represent the button.
     */
    sortOrderIcon = (button: 'words' | 'counts'): string => {
        return button === 'words'
            ? this.state.sortBy === "words"
                ? "fa fa-fw fa-chevron-circle-up"
                : "far fa-fw fa-circle"
            : this.state.sortBy === "counts"
                ? "fa fa-fw fa-chevron-circle-down"
                : "far fa-fw fa-circle"
    }

    /**
     * Toggle between name and date sorting.
     */
    toggleSortOrder = () => {
        this.setState({
            sortBy: this.state.sortBy === "words"
                ? "counts"
                : "words"
        })
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
            command: () => this.props.onExit()
        })
        return <Menubar key="analyzer-menu" model={items} id="app-main-menu" />
    }

    /**
     * Returns JSX for the menubar.
     * 
     * NOTE: Do not `setState()` in this method.
     */
    renderAnalysis = (): Array<JSX.Element> => {
        let words = new TSMap<string, { word: string, count: number }>()
        this.props.snapshot.subcaucuses.forEach((subcaucus) => {
            // snip the name into words
            const snips = subcaucus.displayName().match(/\b(\w+)\b/g)
            if (snips) {
                // filter the words into a distinct set of lowercase words
                const distinct = snips.map((v) => v.toLocaleLowerCase()).filter((value, index, self) => self.indexOf(value) === index)
                distinct.forEach((word) => {
                    let record = words.get(word) || { word: word, count: 0 }
                    record.count += subcaucus.count
                    words.set(word, record)
                })
            }
        })
        words.set("END", { word: "END", count: 0 }) // added just in case there is no empty subcaucus

        let combinedWords = new TSMap<string, number>()
        let currentCount = 0
        let currentWords: Array<string> = []
        words.values().sort((a, b) => {
            return b.count - a.count
        }).forEach((record) => {
            // note that the records with count of zero will never be pushed
            // because they will never differ from the currentCount
            // that is why we include the "END" record above
            if (currentCount !== record.count) {
                const joinedWords = currentWords.join(" ")
                combinedWords.set(joinedWords, currentCount)
                currentCount = record.count
                currentWords = [record.word]
            } else {
                currentWords.push(record.word)
            }
        })

        const data = {
            labels: combinedWords.keys(),
            datasets: [{
                backgroundColor: '#42A5F5',
                data: combinedWords.values()
            }]
        }

        return ([<Chart type="horizontalBar" data={data} options={{ legend: { display: false } }} />])

        // let rows: Array<JSX.Element> = []
        // combinedWords.values().sort((a, b) => {
        //     return b.count - a.count
        // }).forEach((record) => {
        //     if (record.count > 0) {
        //         rows.push(
        //             <div className={`analyzer-row`}>
        //                 <div className="analyzer-word">{record.word}</div>
        //                 <div className="analyzer-count">{record.count}</div>
        //             </div>
        //         )
        //     }
        // })

        // return rows
    }

    /**
     * Render JSX for this component.
     */
    render() {
        return (
            <div className="analyzer">
                {this.renderMenu()}
                <div id="meeting-info">
                    <div id="meeting-name" className="not-button">
                        This is an analysis of the words in subcaucus names...
                    </div>
                </div>
                <div id="analyzer-container">
                    <div id="analyzer-header">
                        <Button id="analyzer-words-head"
                            label="Words"
                            icon={this.sortOrderIcon("words")}
                            onClick={() => this.toggleSortOrder()}
                        />
                        <Button id="analyzer-counts-head"
                            label="Counts"
                            iconPos="right"
                            icon={this.sortOrderIcon("counts")}
                            onClick={() => this.toggleSortOrder()}
                        />
                    </div>
                    {this.renderAnalysis()}
                </div>
            </div>
        )
    }
}
