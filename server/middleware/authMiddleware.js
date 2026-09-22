//We import JWT functionality so that we can verify tokens.
const jwt = require("jsonwebtoken");

// ===============================
// VERIFY JWT TOKEN
// ===============================
const authenticateToken = (req, res, next) => { //next->"Authentication is successful. Continue to the next middleware/route."
  try {
    //Headers contain extra information about the request.
    //authorization header We are specifically getting the Authorization header.
    const authHeader = req.headers.authorization; 
    //jo authHeader ny enter hoy to access token required message avse json format ma
    if (!authHeader) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1]; //split(" ")[1] extracts the JWT token from "Bearer token".

    if (!token) {
      return res.status(401).json({
        message: "Invalid token",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET //process ->process is a built-in Node.js object
      //process.env = Node.js object used to access environment variables.
    );

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

// ===============================
// CHECK USER ROLE
// ===============================
const authorizeRole = (...allowedRoles) => {//The ... here is called the rest operator.It allows us to pass multiple roles.
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!allowedRoles.includes(req.user.role)) { //.includes() checks whether something exists inside an array.
      return res.status(403).json({
        message: "Access denied",
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken, //Checks whether the JWT token is valid.
  authorizeRole,//Checks whether the authenticated user's role is allowed.
};