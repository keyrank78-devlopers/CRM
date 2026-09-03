const express = require("express");
const router = express.Router();

// Controllers
const { createEmployee, getEmployees, createVendor } = require("../controllers/admin.controller");
const {
    createDepartment,
    getDepartments,
    getDepartmentById,
    updateDepartment,
    changeDepartmentStatus
} = require("../controllers/department.controller");
const {
    createDesignation,
    getDesignations,
    getDesignationById,
    getDesignationsByDepartment,
    updateDesignation,
    changeDesignationStatus
} = require("../controllers/designation.controller");

// Middlewares & Validators
const { registerValidator } = require("../validators/auth.validator");
const validate = require("../middlewares/validate.middleware");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin management APIs
 */

// All admin routes should be protected and only accessible by ADMIN
router.use(authenticate, authorize("ADMIN"));

// --- Employee Routes ---
/**
 * @swagger
 * /api/v1/admin/employees/create:
 *   post:
 *     summary: Create an Employee
 *     tags: [Admin - Employees]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   locality:
 *                     type: string
 *                   street:
 *                     type: string
 *                   landmark:
 *                     type: string
 *               department:
 *                 type: string
 *                 description: ObjectId of the department
 *               designation:
 *                 type: string
 *                 description: ObjectId of the designation
 *     responses:
 *       201:
 *         description: Employee created successfully
 */
router.post("/employees/create", registerValidator, validate, createEmployee);

/**
 * @swagger
 * /api/v1/admin/employees/list:
 *   get:
 *     summary: Get all Employees
 *     tags: [Admin - Employees]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, email, or phone
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by Department ID
 *       - in: query
 *         name: designation
 *         schema:
 *           type: string
 *         description: Filter by Designation ID
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get("/employees/list", getEmployees);

// --- Vendor Routes ---
/**
 * @swagger
 * /api/v1/admin/vendors/create:
 *   post:
 *     summary: Create a Vendor
 *     tags: [Admin - Vendors]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               address:
 *                 type: object
 *                 properties:
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   pincode:
 *                     type: string
 *                   locality:
 *                     type: string
 *                   street:
 *                     type: string
 *                   landmark:
 *                     type: string
 *     responses:
 *       201:
 *         description: Vendor created successfully
 */
router.post("/vendors/create", registerValidator, validate, createVendor);

// --- Department Routes ---
/**
 * @swagger
 * /api/v1/admin/departments/create:
 *   post:
 *     summary: Create a Department
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Department created
 */
router.post("/departments/create", createDepartment);

/**
 * @swagger
 * /api/v1/admin/departments/list:
 *   get:
 *     summary: Get all Departments
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of Departments
 */
router.get("/departments/list", getDepartments);

/**
 * @swagger
 * /api/v1/admin/departments/details/{id}:
 *   get:
 *     summary: Get Department by ID
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Department details
 */
router.get("/departments/details/:id", getDepartmentById);

/**
 * @swagger
 * /api/v1/admin/departments/update/{id}:
 *   patch:
 *     summary: Update Department
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Department updated
 */
router.patch("/departments/update/:id", updateDepartment);

/**
 * @swagger
 * /api/v1/admin/departments/status/{id}:
 *   patch:
 *     summary: Change Department Status
 *     tags: [Admin - Departments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/departments/status/:id", changeDepartmentStatus);

// --- Designation Routes ---
/**
 * @swagger
 * /api/v1/admin/designations/create:
 *   post:
 *     summary: Create a Designation
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *                 description: ObjectId of the department
 *     responses:
 *       201:
 *         description: Designation created
 */
router.post("/designations/create", createDesignation);

/**
 * @swagger
 * /api/v1/admin/designations/list:
 *   get:
 *     summary: Get all Designations
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by Department ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of Designations
 */
router.get("/designations/list", getDesignations);

/**
 * @swagger
 * /api/v1/admin/designations/details/{id}:
 *   get:
 *     summary: Get Designation by ID
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Designation details
 */
router.get("/designations/details/:id", getDesignationById);

/**
 * @swagger
 * /api/v1/admin/designations/list/department/{departmentId}:
 *   get:
 *     summary: Get Designations by Department ID
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: departmentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of Designations
 */
router.get("/designations/list/department/:departmentId", getDesignationsByDepartment);

/**
 * @swagger
 * /api/v1/admin/designations/update/{id}:
 *   patch:
 *     summary: Update Designation
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Designation updated
 */
router.patch("/designations/update/:id", updateDesignation);

/**
 * @swagger
 * /api/v1/admin/designations/status/{id}:
 *   patch:
 *     summary: Change Designation Status
 *     tags: [Admin - Designations]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/designations/status/:id", changeDesignationStatus);

// --- Category Routes ---
const { createCategory, updateCategory, changeCategoryStatus } = require("../controllers/category.controller");
const upload = require("../config/cloudinary");

/**
 * @swagger
 * /api/v1/admin/categories/create:
 *   post:
 *     summary: Create a Category
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Category created
 */
router.post("/categories/create", upload.single("picture"), createCategory);

/**
 * @swagger
 * /api/v1/admin/categories/update/{id}:
 *   patch:
 *     summary: Update Category
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               picture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category updated
 */
router.patch("/categories/update/:id", upload.single("picture"), updateCategory);

/**
 * @swagger
 * /api/v1/admin/categories/status/{id}:
 *   patch:
 *     summary: Change Category Status
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/categories/status/:id", changeCategoryStatus);



// --- SubCategory Routes ---
const { createSubCategory, updateSubCategory, changeSubCategoryStatus } = require("../controllers/subcategory.controller");

/**
 * @swagger
 * /api/v1/admin/subcategories/create:
 *   post:
 *     summary: Create a SubCategory
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID or Name
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: SubCategory created
 */
router.post("/subcategories/create", upload.single("image"), createSubCategory);

/**
 * @swagger
 * /api/v1/admin/subcategories/update/{id}:
 *   patch:
 *     summary: Update SubCategory
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID or Name
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: SubCategory updated
 */
router.patch("/subcategories/update/:id", upload.single("image"), updateSubCategory);

/**
 * @swagger
 * /api/v1/admin/subcategories/status/{id}:
 *   patch:
 *     summary: Change SubCategory Status
 *     tags: [Admin - Categories]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/subcategories/status/:id", changeSubCategoryStatus);



// --- Product Routes ---
const { createProduct, updateProduct, changeProductStatus } = require("../controllers/product.controller");

/**
 * @swagger
 * /api/v1/admin/products/create:
 *   post:
 *     summary: Create a Product
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Category ID or Name
 *               subCategory:
 *                 type: string
 *                 description: SubCategory ID or Name
 *               mrp:
 *                 type: number
 *               sellPrice:
 *                 type: number
 *               description:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeyword:
 *                 type: string
 *               variants:
 *                 type: string
 *                 description: JSON stringified array of objects e.g., [{"key":"Size","value":"XL"}]
 *               mainImage:
 *                 type: string
 *                 format: binary
 *                 description: Primary product image
 *               otherImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Additional product images (up to 5)
 *     responses:
 *       201:
 *         description: Product created successfully
 */
router.post(
    "/products/create", 
    upload.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "otherImages", maxCount: 5 }
    ]), 
    createProduct
);

/**
 * @swagger
 * /api/v1/admin/products/update/{id}:
 *   patch:
 *     summary: Update Product
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *               mrp:
 *                 type: number
 *               sellPrice:
 *                 type: number
 *               description:
 *                 type: string
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *               metaKeyword:
 *                 type: string
 *               variants:
 *                 type: string
 *               mainImage:
 *                 type: string
 *                 format: binary
 *               otherImages:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Product updated
 */
router.patch(
    "/products/update/:id", 
    upload.fields([
        { name: "mainImage", maxCount: 1 },
        { name: "otherImages", maxCount: 5 }
    ]), 
    updateProduct
);

/**
 * @swagger
 * /api/v1/admin/products/status/{id}:
 *   patch:
 *     summary: Change Product Status
 *     tags: [Admin - Products]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE]
 *     responses:
 *       200:
 *         description: Status changed
 */
router.patch("/products/status/:id", changeProductStatus);

module.exports = router;
