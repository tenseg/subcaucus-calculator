import * as React from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';

// const logo = require('./primereact-logo.png');

interface CardProps {
    title: string
    description?: string
    type?: 'text' | 'positive integer'
    value?: string
    allowEmpty?: boolean
    onSave?: ((value: string) => void)
}
interface CardState {
    value: string
}

export class ValueCard extends React.Component<CardProps, CardState> {

    type: 'text' | 'positive integer' = 'text'
    isPositiveInt = false
    originalValue = ''

    constructor(props: CardProps) {
        super(props);
        this.type = (this.props.type == undefined ? 'text' : this.props.type)
        this.isPositiveInt = (this.type == 'positive integer')
        this.originalValue = (this.props.value == undefined ? '' : this.props.value);
        this.state = {
            value: this.originalValue,
        };
    }

    // see http://blog.stevenlevithan.com/archives/faster-trim-javascript
    trim = (str: string): string => {
        str = str.replace(/^\s+/, '');
        for (var i = str.length - 1; i >= 0; i--) {
            if (/\S/.test(str.charAt(i))) {
                str = str.substring(0, i + 1);
                break;
            }
        }
        return str;
    }

    handleChange = () => (event: React.FormEvent<HTMLInputElement>) => {
        switch (this.type) {
            case 'positive integer':
                var num = Number(event.currentTarget.value)
                if (num < 0) {
                    num = 0
                }
                this.setState({ value: String(num) })
                break;
            case 'text':
                this.setState({ value: event.currentTarget.value })
                break;
        }
    }

    focusOnWholeText = () => (event: React.FormEvent<HTMLInputElement>) => {
        // event properties must be copied to use async
        const target = event.currentTarget;
        // do this async to try to make Safari behave
        setTimeout(() => target.setSelectionRange(0, 9999), 0);
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
            this.props.onSave(this.trim(value))
        }
    }

    render() {

        const illegallyEmpty = (this.isEmpty(this.state.value) && !this.props.allowEmpty)

        const saveButton =
            <Button
                label="Save"
                icon="pi pi-check"
                disabled={illegallyEmpty}
                onClick={this.save(this.state.value)}
            />

        const cancelButton = this.isEmpty(this.originalValue)
            ? <></>
            : <Button
                label="Cancel"
                icon="pi pi-times"
                className="p-button-secondary"
                onClick={this.save(this.originalValue)}
            />

        const cardFooter = (
            <span>
                {saveButton}{cancelButton}
            </span>
        );

        return (
            <div className="background-blocker">
                <Card
                    className="value-card"
                    title={this.props.title}
                    footer={cardFooter}
                >
                    {this.props.description
                        ? <p>{this.props.description}</p>
                        : <></>}
                    <InputText id="delegates-allowed"
                        className={this.isPositiveInt ? "number" : "text"}
                        keyfilter={this.isPositiveInt ? "pint" : ""}
                        type="text"
                        pattern={this.isPositiveInt ? '\d*' : undefined}
                        value={this.state.value}
                        onChange={this.handleChange()}
                        onFocus={this.isPositiveInt ? this.focusOnWholeText() : undefined}
                    />
                </Card>
            </div>
        );
    }
}
