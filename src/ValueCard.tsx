import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import * as _u from './Utilities'

interface Props {
    id?: string
    title: string
    description?: string
    image?: string
    alt?: string
    type?: 'text' | 'positive integer'
    value?: string
    defaultValue?: string
    allowEmpty?: boolean
    onSave?: ((value?: string) => void)
}
interface State {
    value: string
}

export class ValueCard extends React.Component<Props, State> {

    type: 'text' | 'positive integer' = 'text'
    isPositiveInt = false
    originalValue = ''
    defaultValue = ''
    textFieldRef: React.RefObject<any> = React.createRef()

    constructor(props: Props) {
        super(props)
        this.type = (this.props.type == undefined ? 'text' : this.props.type)
        this.isPositiveInt = (this.type == 'positive integer')
        this.originalValue = _u.unwrapString(this.props.value)
        this.defaultValue = _u.unwrapString(this.props.defaultValue)
        this.state = {
            value: this.originalValue,
        }
    }

    handleChange = () => (event: React.FormEvent<HTMLInputElement>) => {
        switch (this.type) {
            case 'positive integer':
                var num = Number(event.currentTarget.value)
                if (num < 0) {
                    num = 0
                }
                this.setState({ value: String(num) })
                break
            case 'text':
                this.setState({ value: event.currentTarget.value })
                break
        }
    }

    handleKey = () => (event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            if (this.props.onSave) {
                this.props.onSave(this.state.value.trim())
            }
        }
    }

    focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
        // event properties must be copied to use async
        const target = event.currentTarget
        // do this async to try to make Safari behave
        setTimeout(() => target.setSelectionRange(0, 9999), 0)
    }

    isEmpty = (value: string): boolean => {
        var empty = (value == '')
        if (this.props.type == 'positive integer') {
            empty = (empty || value == '0')
        }
        return empty
    }

    save = (value: string | null) => (event: React.MouseEvent<HTMLButtonElement>) => {
        if (this.props.onSave) {
            if (value == null) {
                this.props.onSave()
            } else {
                this.props.onSave(value.trim())
            }
        }
    }

    componentDidMount = () => {
        _u.debug("card mounted")
        const target = ReactDOM.findDOMNode(this.textFieldRef.current)
        if (this.textFieldRef.current instanceof InputText && target != null) {
            switch (this.type) {
                case 'text':
                case 'positive integer':
                    try {
                        _u.debug("selecting", target)
                        // @ts-ignore
                        target.select()
                    } catch {
                        console.log("oops")
                    }
                    break
            }
        }
    }

    idPlus = (suffix: string): string | undefined => {
        return this.props.id ? `${this.props.id}-${suffix}` : undefined
    }

    render() {

        const illegallyEmpty = (this.isEmpty(this.state.value) && this.isEmpty(this.defaultValue) && !this.props.allowEmpty)

        const saveButton = (this.props.value != undefined)
            ? <Button id={this.idPlus("save-button")}
                label="Save"
                icon="pi pi-check"
                disabled={illegallyEmpty}
                onClick={this.save(_u.unwrapString(this.state.value, this.defaultValue))}
            />
            : <Button id={this.idPlus("close-button")}
                label="Close"
                icon="pi pi-times"
                onClick={this.save(null)}
            />

        const cancelButton = this.isEmpty(this.originalValue) || (!this.props.value)
            ? <></>
            : <Button id={this.idPlus("cancel-button")}
                label="Cancel"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={this.save(null)}
            />

        const cardFooter = (
            <span>
                {saveButton}{cancelButton}
            </span>
        )

        return (
            <div className="valuecard-wrapper">
                <div className="background-blocker">
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
                            <Button
                                id={this.idPlus("picture-close-button")}
                                icon="pi pi-times"
                                onClick={this.save(null)}
                            />
                        </div>
                        : undefined
                    }
                    footer={cardFooter}
                >
                    {this.props.children
                        ? <div id={this.idPlus("valuecard-children")} className="valuecard-children">
                            {this.props.children}
                        </div>
                        : <></>}
                    {this.props.description
                        ? <div id={this.idPlus("valuecard-description")} className="valuecard-description">
                            <p>{this.props.description}</p>
                        </div>
                        : <></>}
                    {this.props.value != undefined
                        ? <InputText id={this.idPlus("card-field")}
                            className={this.isPositiveInt ? "number" : "text"}
                            keyfilter={this.isPositiveInt ? "pint" : ""}
                            type="text"
                            pattern={this.isPositiveInt ? "\\d*" : undefined}
                            value={this.state.value}
                            placeholder={this.defaultValue}
                            onChange={this.handleChange()}
                            onFocus={this.isPositiveInt ? this.focusOnWholeText() : undefined}
                            onKeyUp={this.handleKey()}
                            ref={this.textFieldRef}
                        />
                        : <></>
                    }
                </Card>
            </div>
        )
    }
}
