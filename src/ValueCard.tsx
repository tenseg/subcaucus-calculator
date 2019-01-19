import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Button } from 'primereact/button'
import { Card } from 'primereact/card'
import { InputText } from 'primereact/inputtext'
import { debug } from './Utilities'

interface Props {
    id?: string
    title: string
    description?: string
    type?: 'text' | 'positive integer'
    value?: string
    defaultValue?: string
    allowEmpty?: boolean
    onSave?: ((value: string) => void)
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
        this.originalValue = (this.props.value == undefined ? '' : this.props.value)
        this.defaultValue = (this.props.defaultValue == undefined ? '' : this.props.defaultValue)
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

    save = (value: string) => (event: React.MouseEvent<HTMLButtonElement>) => {
        if (this.props.onSave) {
            this.props.onSave(value.trim())
        }
    }

    componentDidMount = () => {
        debug("card mounted")
        const target = ReactDOM.findDOMNode(this.textFieldRef.current)
        if (this.textFieldRef.current instanceof InputText && target != null) {
            switch (this.type) {
                case 'text':
                case 'positive integer':
                    try {
                        debug("selecting", target)
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

        const saveButton =
            <Button id={this.idPlus("save-button")}
                label="Save"
                icon="pi pi-check"
                disabled={illegallyEmpty}
                onClick={this.save(this.state.value ? this.state.value : this.defaultValue)}
            />

        const cancelButton = this.isEmpty(this.originalValue)
            ? <></>
            : <Button id={this.idPlus("cancel-button")}
                label="Cancel"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={this.save(this.originalValue)}
            />

        const cardFooter = (
            <span>
                {saveButton}{cancelButton}
            </span>
        )

        return (
            <div className="background-blocker">
                <Card id={this.idPlus("card")}
                    className={`value-card ${this.idPlus("card")}`}
                    title={this.props.title}
                    footer={cardFooter}
                >
                    {this.props.description
                        ? <p>{this.props.description}</p>
                        : <></>}
                    <InputText id={this.idPlus("card-field")}
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
                </Card>
            </div>
        )
    }
}
