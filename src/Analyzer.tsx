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
import { ValueCard } from './ValueCard';

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
    counting: 'members' | 'delegates' | 'subcaucuses'
    showSettings: boolean
}

/**
 * A ReactJS component that presents the snapshot loader.
 */
export class Analyzer extends React.Component<Props, State> {

    /**
     * List of substitute terms. This allows for grouping certain words.
     * The user can change this default list via `renderSettings()`.
     */
    substitutions: { [props: string]: string } = {
        for: '',
        of: '',
        the: '',
        a: '',
        s: '',
        and: '',
        that: '',
        in: '',
        it: '',
        hillary: "Hillary Clinton",
        hilary: "Hillary Clinton",
        clinton: "Hillary Clinton",
        bernie: "Bernie Sanders",
        sanders: "Bernie Sanders",
    }

    constructor(props: Props) {
        super(props)
        this.getLocalSubstitutions()
        this.state = {
            counting: "delegates",
            showSettings: false,
        }
    }

    /**
     * Look for the user's own substitutions in local storage.
     */
    getLocalSubstitutions = () => {
        const json = JSON.parse(localStorage.getItem('substitutions') || 'false')
        if (json) {
            this.substitutions = json
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
        const counting = this.state.counting
        // an empty target in joinWords means we want to ignore this word
        let termsMap = new TSMap<string, { term: string, count: number }>()
        this.props.snapshot.subcaucuses.forEach((subcaucus) => {
            let count = subcaucus.count
            if (count === 0) return
            // snip the name into words
            const words = subcaucus.displayName().match(/\b(\w+)\b/g)
            if (words) {
                // filter the words into a distinct set of lowercase words
                const distinct = words.map((v) => v.toLocaleLowerCase()).filter((value, index, self) => self.indexOf(value) === index)
                distinct.forEach((word) => {
                    let term = word
                    if (this.substitutions[word] !== undefined) {
                        term = this.substitutions[word]
                    }
                    if (term === '') return
                    let record = termsMap.get(term) || { term: term, count: 0 }
                    if (counting === 'delegates') {
                        count = subcaucus.delegates
                    }
                    if (counting === 'subcaucuses') {
                        count = 1
                    }
                    record.count += count
                    termsMap.set(term, record)
                })
            }
        })
        termsMap.set("END", { term: "END", count: 0 }) // marking the end with a fake empty term

        let combinedTerms = new TSMap<string, number>()
        let currentCount = 0
        let currentTerms: Array<string> = []
        termsMap.values().sort((a, b) => {
            return b.count - a.count
        }).forEach((record) => {
            // note that the records with count of zero will never be pushed
            // because they will never differ from the currentCount
            // that is why we include the "END" record above
            if (currentCount !== record.count) {
                const joinedTerms = currentTerms.join(" ")
                if (currentCount > 0) {
                    combinedTerms.set(joinedTerms, currentCount)
                }
                currentCount = record.count
                currentTerms = [record.term]
            } else {
                currentTerms.push(record.term)
            }
        })

        let backgroundColor = 'rgba(54, 162, 235, 0.2)'
        let borderColor = 'rgb(54, 162, 235)'

        if (counting === 'delegates') {
            backgroundColor = 'rgba(75, 192, 192, 0.2)'
            borderColor = 'rgb(75, 192, 192)'
        }

        if (counting === 'subcaucuses') {
            backgroundColor = 'rgba(255, 159, 64, 0.2)'
            borderColor = 'rgb(255, 159, 64)'
        }

        const data = {
            labels: combinedTerms.keys(),
            datasets: [{
                label: counting,
                backgroundColor: backgroundColor,
                borderColor: borderColor,
                borderWidth: 1,
                data: combinedTerms.values()
            }]
        }

        _u.debug("data for chart", data)

        const fontFamily = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen-Sans,Ubuntu,Cantarell,'Helvetica Neue',sans-serif"

        return ([<Chart key="chart" className="chart-element" type="horizontalBar" data={data} options={{
            maintainAspectRatio: false,
            aspectRatio: 1,
            legend: {
                display: false,
                labels: {
                    fontFamily: fontFamily,
                },
            },
            scales: {
                yAxes: [{
                    ticks: {
                        fontFamily: fontFamily,
                        autoSkip: false,
                    },
                    gridLines: {
                        display: false,
                    },
                }],
                xAxes: [{
                    ticks: {
                        fontFamily: fontFamily,
                        min: 0,
                    },
                }]
            },
            tooltips: {
                titleFontFamily: fontFamily,
                bodyFontFamily: fontFamily,
                footerFontFamily: fontFamily,
            },
        }} />])

    }

    /**
     * Switch among charts.
     */
    switch = (value: "members" | "delegates" | "subcaucuses") => (event: React.MouseEvent<HTMLButtonElement>) => {
        event.currentTarget.blur()
        this.setState({ counting: value })
    }

    /**
     * Transform plain text version of substitutions to
     * structured version and save that in localStorage.
     */
    saveSubstitutions = (value?: string) => {
        if (value) {
            this.substitutions = {}
            const lines = value.split("\n")
            lines.forEach((line) => {
                const words = line.match(/\b(\w+)\b/g)
                if (words) {
                    let term = words.shift()
                    if (term) {
                        term = term.toLocaleLowerCase()
                        const substitution = words.join(" ").trim()
                        this.substitutions[term] = substitution
                    }
                }
            })
            localStorage.setItem('substitutions', JSON.stringify(this.substitutions))
        }
        this.setState({ showSettings: false })
    }

    /**
     * Transform structured substitutions to plain text and
     * allow the user to make changes.
     */
    renderSettings = (): JSX.Element => {
        if (!this.state.showSettings) return <></>
        // change substitutions object into plain text for editing
        let text = Object.keys(this.substitutions).reduce((sofar: string, term: string): string => {
            const substitute = this.substitutions[term]
            return sofar + `${term} ${substitute}\n`
        }, '')
        return (
            <ValueCard
                className="analysis-substitutions-card"
                title="Substitutions"
                value={text}
                type="long text"
                onSave={this.saveSubstitutions}
                allowEmpty={true}
            >
                <p>
                    This analysis is based on the words found in each subcaucus name. Below is a list of substitutions that will be made to allow you to group certain words together.
                    </p><p>
                    The first word on a line is the term that will be replaced, and any other words on the line will be the replacement value. Any single word on a line by itself will force the analysis to ignore that word.
                    </p><p>
                    Typically this is used to bring together variant forms of a name, for example including both "hillary Hillary Clinton" and "clinton Hillary Clinton" will make sure that both the first name and the last name are analyzed as the same term.
                </p>
            </ValueCard >
        )
    }

    /**
     * Render JSX for this component.
     */
    render() {
        const { name, revision } = this.props.snapshot

        return (
            <div className="analyzer">
                <nav>
                    {this.renderMenu()}
                </nav>
                <main>
                    <section id="meeting-info">
                        <h1 id="meeting-name" className="not-button">
                            {name ? name : this.props.snapshot.defaultName()}
                            {revision != ''
                                ? <span className="snapshot">
                                    {revision}
                                </span>
                                : ''
                            }
                        </h1>
                    </section>
                    <section id="analyzer-container">
                        <div id="analyzer-chart">
                            {this.renderAnalysis()}
                        </div>
                        <section id="analyzer-buttons">
                            <Button id="counting-delegates-button"
                                label="Delegates"
                                className={"counting-delegates"}
                                disabled={this.state.counting === "delegates"}
                                onClick={this.switch("delegates")}
                            />
                            <Button id="counting-members-button"
                                label="Members"
                                className={"counting-members"}
                                disabled={this.state.counting === "members"}
                                onClick={this.switch("members")}
                            />
                            <Button id="counting-subcaucuses-button"
                                label="Subcaucuses"
                                className={"counting-subcaucuses"}
                                disabled={this.state.counting === "subcaucuses"}
                                onClick={this.switch("subcaucuses")}
                            />
                        </section>
                    </section>
                    <Button id="analyzer-settings-button"
                        aria-label="Settings"
                        icon="fa fa-fw fa-cog"
                        onClick={() => this.setState({ showSettings: true })}
                    />
                    {this.renderSettings()}
                </main>
            </div>
        )
    }
}
