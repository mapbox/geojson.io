module.exports = {
    "rules": {
        "no-console": [0],
        "quotes": [
            2,
            "single"
        ],
        "linebreak-style": [
            2,
            "unix"
        ],
        "semi": [
            2,
            "always"
        ]
    },
    "env": {
        "es6": true,
        "node": true,
        "browser": true
    },
    "globals": {
        "L": true,
        "CodeMirror": true,
        "Base64": true,
        "d3": true
    },
    "extends": "eslint:recommended",
    "ecmaFeatures": {
        "jsx": true,
        "experimentalObjectRestSpread": true
    },
    "plugins": [
        "react"
    ]
};
