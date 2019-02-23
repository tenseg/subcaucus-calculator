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
import { InputTextarea } from 'primereact/inputtextarea'

// see https://github.com/willmcpo/body-scroll-lock
import { disableBodyScroll, clearAllBodyScrollLocks } from 'body-scroll-lock'

// local to this app
import * as _u from './Utilities'

/**
 * Helps distinguish the two kinds of values a ValueCard can ask for.
 */
type KindOfValue = 'text' | 'long text' | 'positive integer'

/**
 * Properties of a ValueCard component.
 */
interface Props {
    id: string
    title: string
    description?: string
    image?: string
    alt?: string
    className?: string
    extraButtons?: JSX.Element
    footer?: JSX.Element
    type?: KindOfValue
    value?: string
    defaultValue?: string
    valueLabel?: string
    allowEmpty?: boolean
    historyKey?: string
    onSave: ((value?: string) => void)
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

    cardRef: React.RefObject<HTMLDivElement> = React.createRef();

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
     * A place to store whatever function was handling
     * `window.onopostate` before we got here.
     */
    priorBackButtonHandler: any

    /**
     * Preload any images that may be used by the card.
     * Avoid a resizing card box.
     * 
     * Arrange to handle the back button.
     * 
     * Called when an instance of a component is being created and inserted into the DOM.
     */
    componentDidMount = () => {
        // register for back button
        _u.debug(`${this.props.id} did mount with history state: `, history.state)
        _u.setHistory(this.props.id, this.props.historyKey)
        _u.debug(`${this.props.id} pushed, now history state: `, history.state)
        this.priorBackButtonHandler = window.onpopstate
        window.onpopstate = this.handleBackButton(this.props.id)

        // force the browser to load the image before the render
        if (this.props.image) {
            const image = new Image()
            image.src = this.props.image
        }
        // hook up the ref
        const cardElement = this.cardRef.current
        if (cardElement) {
            disableBodyScroll(cardElement)
        }
    }

    /**
     * Let go of the back button.
     * 
     * Called when a component is being removed from the DOM.
     */
    componentWillUnmount = () => {
        // let go of the back button
        _u.debug(`${this.props.id} will unmount with history state: `, history.state)
        window.onpopstate = this.priorBackButtonHandler
        if (_u.isHistory(this.props.id, this.props.historyKey)) {
            history.back()
        }

        // make sure we are no longer preventing the main body from scrolling
        clearAllBodyScrollLocks()
    }

    /**
     * Make sure we properly exit when the back button is pressed.
     */
    handleBackButton = (from: string) => (event: PopStateEvent) => {
        _u.debug(`${this.props.id} handling back button with history state ${history.state} from ${from}`)
        // only handle the exit case if this is the history.state we expect to encounter
        if (from === this.props.id) {
            this.props.onSave()
        } else {
            // just in case we get a late report from another component
            // sending a programatic history.back() from its unmount
            _u.setHistory(this.props.id, this.props.historyKey)
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
    handleChange = () => (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        _u.debug("save")
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
     * Stop clicks in the card from going any further.
     */
    stopPropagation = () => (event: React.MouseEvent<HTMLDivElement>) => {
        _u.debug("stop propagation")
        event.stopPropagation()
    }

	/**
	 * Helper for creating id's for the card's DOM elements.
	 */
    idPlus = (suffix: string): string => {
        return `${this.props.id}-${suffix}`
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
            <>
                <div className="background-blocker"
                    onClick={this.save()}
                >
                </div>
                <div className="valuecard-wrapper" onClick={this.save()}>
                    <div className="valuecard-inner-wrapper" ref={this.cardRef} onClick={this.save()}>
                        <section className="valuecard" onClick={this.stopPropagation()}>
                            <Card id={this.idPlus("valuecard")}
                                className={`${this.idPlus("valuecard")} ${this.props.className}`}
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
                                            ? <Button id={this.idPlus("picture-close-button")}
                                                aria-label="Close"
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
                                    ? <>
                                        {this.props.type === 'long text'
                                            ? <InputTextarea id={this.idPlus("card-field")}
                                                className="text"
                                                type="text"
                                                value={value}
                                                rows={5}
                                                cols={40}
                                                onChange={this.handleChange()}
                                                autoFocus
                                            />
                                            : <InputText id={this.idPlus("card-field")}
                                                className={isPositiveInteger ? "number" : "text"}
                                                autoComplete="off"
                                                keyfilter={isPositiveInteger ? "pint" : ""}
                                                type="text"
                                                pattern={isPositiveInteger ? "\\d*" : undefined}
                                                inputMode={isPositiveInteger ? "numeric" : undefined}
                                                value={isPositiveInteger ? (value === '0' ? '' : value) : value} // show 0 as blank for positive integers
                                                placeholder={this.props.defaultValue}
                                                onChange={this.handleChange()}
                                                // onFocus={this.isPositiveInt ? this.focusOnWholeText() : undefined}
                                                onKeyUp={this.handleKey()}
                                                autoFocus
                                            />}
                                        <label htmlFor={this.idPlus("card-field")} className="screenreader">{this.props.valueLabel || this.props.title}</label>
                                    </>
                                    : ''
                                }
                            </Card>
                        </section>
                    </div>
                </div>
            </>
        )
    }
}
