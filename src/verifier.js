const { CognitoJwtVerifier } = require("aws-jwt-verify")

const verifier = CognitoJwtVerifier.create({
    userPoolId: 'us-east-1_z8gdefyRH',
    clientId: '7r3govr4tpr3o14pae40srup3n',
    tokenUse: "access",
})


module.exports = verifier;