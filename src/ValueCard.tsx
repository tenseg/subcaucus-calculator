/**
 * ValueCard.tsx
 *
 * A ReactJS component that presents a modal dialog
 * built on the Card component of PrimeReact.
 *
 * Copyright 2019 by Tenseg LLC
 * Made available under the MIT License
 */

import * as React from 'react'

// see https://www.primefaces.org/primereact
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'

// local to this app
import * as _u from './Utilities'

/**
 * Helps distinguish the two kinds of values a ValueCard can ask for.
 */
type KindOfValue = 'text' | 'positive integer'

/**
 * Properties of a ValueCard component.
 */
interface Props {
    id?: string
    title: string
    description?: string
    image?: string
    alt?: string
    extraButtons?: JSX.Element
    footer?: JSX.Element
    type?: KindOfValue
    value?: string
    defaultValue?: string
    allowEmpty?: boolean
    onSave?: ((value?: string) => void)
}

/**
 * State of a ValueCard component.
 */
interface State {
    value: string
}

/**
 * A ReactJS component that presents a modal dialog
 * built on the Card component of PrimeReact.
 */
export class ValueCard extends React.Component<Props, State> {

    /**
     * True would indicate that this value card is supposed to only
     * accept positive integers.
     */
    isPositiveInteger = false

    /**
     * Construct a new ValueCard component.
     */
    constructor(props: Props) {
        super(props)
        this.isPositiveInteger = this.props.type === 'positive integer'
        let initialValue = _u.unwrapString(this.props.value)
        if (!this.props.allowEmpty && this.isEmpty(initialValue)) {
            initialValue = _u.unwrapString(this.props.defaultValue)
        }
        this.state = {
            value: initialValue,
        }
    }

    /**
     * Preload any images that may be used by the card.
     * Avoid a resizing card box.
     */
    componentDidMount = () => {
        // force the browser to load the image before the render
        if (this.props.image) {
            const image = new Image()
            image.src = this.props.image
        }
    }

    /**
     * Returns the value that was initially passed to the card.
     */
    originalValue = (): string => {
        return _u.unwrapString(this.props.value)
    }

    /**
     * The value the card should return if the user leaves the value field blank.
     */
    defaultValue = (): string => {
        return _u.unwrapString(this.props.defaultValue)
    }

    /**
     * Handle changes to the value field.
     */
    handleChange = () => (event: React.FormEvent<HTMLInputElement>) => {
        _u.debug("change", event.currentTarget.value)
        if (this.isPositiveInteger) {
            var num = Number(event.currentTarget.value)
            if (num < 0) {
                num = 0
            }
            this.setState({ value: String(num) })
        } else {
            this.setState({ value: event.currentTarget.value })
        }
    }

    /**
     * Treat the return key the same as hitting the save button.
     */
    handleKey = () => (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            if (this.props.onSave) {
                this.props.onSave(this.state.value.trim())
            }
        }
    }

    /**
     * Select all of the text currently in the value field.
     */
    focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
        // event properties must be copied to use async
        const target = event.currentTarget
        // do this async to try to make Safari behave
        setTimeout(() => target.setSelectionRange(0, 9999), 0)
    }

    /**
     * Test whether the supplied optional string is an empty string ("") or undefined.
     */
    isEmpty = (value?: string): boolean => {
        var empty = (value === '') || (value === undefined)
        if (this.isPositiveInteger) {
            empty = (empty || value === '0')
        }
        return empty
    }

    /**
     * Return news of a saved value to the callback.
     */
    save = (value?: string) => (event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>) => {
        if (this.props.onSave) {
            if (value === undefined) {
                this.props.onSave()
            } else if (this.isEmpty(value) && !this.props.allowEmpty) {
                if (!this.isEmpty(this.props.defaultValue)) {
                    this.props.onSave(this.props.defaultValue)
                }
            } else {
                this.props.onSave(value.trim())
            }
        }
    }

	/**
	 * Helper for creating id's for the card's DOM elements.
	 */
    idPlus = (suffix: string): string | undefined => {
        return this.props.id ? `${this.props.id}-${suffix}` : undefined
    }

    /**
     * Render JSX for the value card component.
     */
    render() {

        const { value } = this.state
        const isPositiveInteger = this.isPositiveInteger

        let cardFooter = <></>

        if (this.props.footer == undefined) {
            const illegallyEmpty = (this.isEmpty(value) && this.isEmpty(this.defaultValue()) && this.props.allowEmpty === false)
            const originalIllegallyEmpty = (this.isEmpty(this.originalValue()) && this.props.allowEmpty === false)

            // don't show a save button at all if there is no save function
            // and if there is no value property, then call the save button "close" instead
            const saveButton = (this.props.onSave
                ? ((this.props.value != undefined)
                    ? <Button id={this.idPlus("save-button")}
                        label="Save"
                        icon="fa fa-fw fa-check"
                        disabled={illegallyEmpty}
                        onClick={this.save(_u.unwrapString(value, this.defaultValue()))}
                    />
                    : <Button id={this.idPlus("close-button")}
                        label="Close"
                        icon="fa fa-fw fa-times"
                        onClick={this.save()}
                    />
                )
                : <></>
            )

            const cancelButton = originalIllegallyEmpty || this.props.value === undefined
                ? ''
                : <Button id={this.idPlus("cancel-button")}
                    label="Cancel"
                    icon="fa fa-fw fa-times"
                    className="p-button-secondary"
                    onClick={this.save()}
                />

            cardFooter = <>{saveButton}{this.props.extraButtons}{cancelButton}</>
        } else {
            cardFooter = this.props.footer
        }

        return (
            <div className="valuecard-wrapper">
                <div className="background-blocker"
                    onClick={this.save()}
                >
                </div>
                <Card id={this.idPlus("valuecard")}
                    className={`valuecard ${this.idPlus("valuecard")}`}
                    title={this.props.title}
                    header={this.props.image
                        ? <div id={this.idPlus("picture-container")}
                            className="picture-container"
                        >
                            <img
                                alt={`${this.props.alt}`}
                                src={`${this.props.image}`}
                            />
                            {this.props.onSave && this.props.value == undefined
                                ? <Button
                                    id={this.idPlus("picture-close-button")}
                                    icon="fa fa-fw fa-times"
                                    onClick={this.save()}
                                />
                                : <></>
                            }
                        </div>
                        : undefined
                    }
                    footer={cardFooter}
                >
                    {this.props.children
                        ? <div id={this.idPlus("valuecard-children")} className="valuecard-children">
                            {this.props.children}
                        </div>
                        : ''}
                    {this.props.description
                        ? <div id={this.idPlus("valuecard-description")} className="valuecard-description">
                            <p>{this.props.description}</p>
                        </div>
                        : ''}
                    {this.props.value != undefined
                        ? <InputText id={this.idPlus("card-field")}
                            className={isPositiveInteger ? "number" : "text"}
                            autoComplete="off"
                            keyfilter={isPositiveInteger ? "pint" : ""}
                            type="text"
                            pattern={isPositiveInteger ? "\\d*" : undefined}
                            value={isPositiveInteger ? (value === '0' ? '' : value) : value} // show 0 as blank for positive integers
                            placeholder={this.props.defaultValue}
                            onChange={this.handleChange()}
                            // onFocus={this.isPositiveInt ? this.focusOnWholeText() : undefined}
                            onKeyUp={this.handleKey()}
                            autoFocus
                        />
                        : ''
                    }
                </Card>
            </div>
        )
    }
}
