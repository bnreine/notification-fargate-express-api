const verifier = require("./verifier.js")

const authMiddleware = async (
    req,
    res,
    next
)=> {
    try {
        const token = req.header("Authorization");

        const payload = await verifier.verify(token);

        req.user = payload;

        next();

    } catch (err) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
}

module.exports = authMiddleware;