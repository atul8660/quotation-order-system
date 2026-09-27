const express = require("express");
const router = express.Router();
const {
    createQuotation,
    getQuotations,
    getQuotationById,
    updateQuotation,
    deleteQuotation,
    submitQuotation,
    sendQuotation,
    acceptQuotation,
    approveQuotation,
    rejectQuotation,
    convertQuotation
} = require("../controllers/quotationController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Protect all quotation routes with JWT
router.use(authMiddleware);

router.route("/")
    .get(getQuotations)
    .post(authorizeRoles("SALES", "ADMIN"), createQuotation);

router.route("/:id")
    .get(getQuotationById)
    .put(authorizeRoles("SALES", "ADMIN"), updateQuotation)
    .delete(authorizeRoles("ADMIN"), deleteQuotation);

// Workflow routes
router.post("/:id/submit", authorizeRoles("SALES", "ADMIN"), submitQuotation);
router.post("/:id/approve", authorizeRoles("MANAGER", "ADMIN"), approveQuotation);
router.post("/:id/reject", authorizeRoles("MANAGER", "ADMIN"), rejectQuotation);
router.post("/:id/send", authorizeRoles("SALES", "ADMIN"), sendQuotation);
router.post("/:id/accept", authorizeRoles("SALES", "ADMIN"), acceptQuotation);
router.post("/:id/convert", authorizeRoles("SALES", "ADMIN"), convertQuotation);

module.exports = router;
