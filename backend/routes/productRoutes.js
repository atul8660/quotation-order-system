const express = require("express");
const router = express.Router();
const {
    createProduct,
    getProducts,
    getProductById,
    updateProduct,
    deleteProduct
} = require("../controllers/productController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/roleMiddleware");

// Protect all product routes with JWT
router.use(authMiddleware);

router.route("/")
    .get(getProducts) // SALES, ADMIN, MANAGER can view
    .post(authorizeRoles("ADMIN", "SALES"), createProduct);

router.route("/:id")
    .get(getProductById)
    .put(authorizeRoles("ADMIN"), updateProduct)
    .delete(authorizeRoles("ADMIN"), deleteProduct);

module.exports = router;
