const schema = {
    "type": "object",
    "properties": {
        "enabled": {
            "type": "boolean"
        },
        "config": {
            "oneOf": [
                {
                    "type": "object",
                    "properties": {
                        "type": {
                            "const": "stockQuoteAlert"
                        },
                        "stock": {
                            "type": "string"
                        },
                    },
                    "required": [
                        "type",
                        "stock",
                    ],
                    "additionalProperties": false
                },
                {
                    "type": "object",
                    "properties": {
                        "type": {
                            "const": "reminder"
                        },
                        "message": {
                            "type": "string"
                        }
                    },
                    "required": [
                        "type",
                        "message"
                    ],
                    "additionalProperties": false
                },
                {
                    "type": "object",
                    "properties": {
                        "type": {
                            "const": "countdown"
                        },
                        "targetAt": {
                            "type": "string",
                            "format": "date-time"
                        },
                        "timezone": {
                            "type": "string",
                            "minLength": 1
                        },
                        "name": {
                            "type": "string",
                            "minLength": 1
                        }
                    },
                    "required": [
                        "type",
                        "targetAt",
                        "timezone",
                        "name"
                    ],

                    "additionalProperties": false
                }
            ]
        }
    },
    "required": [
        "enabled",
        "config"
    ],
    "additionalProperties": false
}

module.exports = schema