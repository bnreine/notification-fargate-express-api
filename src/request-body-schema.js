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
                        // "lowerLimit": {
                        //     "type": "number"
                        // },
                        // "upperLimit": {
                        //     "type": "number"
                        // }
                    },
                    "required": [
                        "type",
                        "stock",
                        // "lowerLimit",
                        // "upperLimit"
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
                }
            ]
        }
    },
    "additionalProperties": false
}

module.exports = schema