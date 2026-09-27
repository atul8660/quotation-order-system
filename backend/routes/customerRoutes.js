const express = require("express");
const router = express.Router();
const {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer
} = require("../controllers/customerController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Protect all customer routes with JWT
router.use(authMiddleware);

router.route("/")
    .get(getCustomers)
    .post(authorizeRoles("ADMIN", "SALES"), createCustomer);

router.route("/:id")
    .get(getCustomerById)
    .put(authorizeRoles("ADMIN", "SALES"), updateCustomer)
    .delete(authorizeRoles("ADMIN", "SALES"), deleteCustomer);

module.exports = router;
