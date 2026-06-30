import jwt from "jsonwebtoken";
import User from "../models/User.js";

/**
 * Protect routes by validating the JWT token
 */
export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "stockroom_jwt_secret_key_123_change_this_in_production");

      // Get user from database, exclude password
      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "Not authorized, user not found" });
      }

      if (!req.user.isActive) {
        return res.status(401).json({ message: "User account is suspended" });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }

  if (!token) {
    res.status(401).json({ message: "Not authorized, no token" });
  }
};

/**
 * Restrict route to specific roles
 */
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Role (${req.user ? req.user.role : "None"}) is not authorized to access this resource`,
      });
    }
    next();
  };
};

/**
 * Enforce property boundary/isolation.
 * Checks if the request's property context matches the user's assigned properties.
 * Excludes Admins and Purchase Managers who have cross-property scopes.
 */
export const requirePropertyAccess = (req, res, next) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ message: "Not authorized" });
  }

  // Admin and Purchase Managers can bypass property isolation
  if (user.role === "Admin" || user.role === "Purchase Manager") {
    return next();
  }

  // Property ID can be in params, query, or body
  const propertyId = req.params.propertyId || req.query.propertyId || req.body.propertyId;

  if (!propertyId) {
    // If no property ID is provided in request, default to user's first assigned property
    if (user.assignedProperties && user.assignedProperties.length > 0) {
      req.propertyId = user.assignedProperties[0].toString();
      return next();
    }
    return res.status(400).json({ message: "Property ID context is required" });
  }

  // Check if requested property ID is in user's assigned list
  const hasAccess = user.assignedProperties.some(
    (id) => id.toString() === propertyId.toString()
  );

  if (!hasAccess) {
    return res.status(403).json({
      message: "Access Denied: You do not have permission for this property",
    });
  }

  req.propertyId = propertyId;
  next();
};
