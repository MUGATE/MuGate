const jwt = require('jsonwebtoken');
const payload = {
    userId: "87288CA2-B987-43EE-85BC-742F30D34F3B",
    email: "101230004@mu.edu.lb",
    name: "Abo Al Fadel Al Abbas Ismael",
    universityId: "101230004"
};
const token = jwt.sign(payload, "***REMOVED***", { expiresIn: 60 * 60 * 24 });
console.log("TOKEN:", token);
