export const validSchema = {
    "$schema": "https://json-schema.org/draft/2020-12/schema",
    "$id": "https://studio.ioflux.org/schema",
    "description": "A JSON Schema describing a person",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "minLength": 2,
            "maxLength": 50
        }
    }
}

export const invalidSchema = {
    "properties": "invalid"
}

export const validSchemaWioutDialect = {
    "$id": "https://studio.ioflux.org/schema",
    "description": "A JSON Schema describing a person",
    "type": "object",
    "properties": {
        "name": {
            "type": "string",
            "minLength": 2,
            "maxLength": 50
        }
    }
}
