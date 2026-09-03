const Product = require("../models/Product");
const Category = require("../models/Category");
const SubCategory = require("../models/SubCategory");
const generateId = require("../utils/generateId");
const mongoose = require("mongoose");

// @desc    Create a Product
// @route   POST /api/v1/admin/products/create
// @access  Private/Admin
const createProduct = async (req, res, next) => {
    try {
        const {
            name,
            category,
            subCategory,
            mrp,
            sellPrice,
            description,
            metaTitle,
            metaDescription,
            metaKeyword,
        } = req.body;

        let variants = [];
        if (req.body.variants) {
            try {
                // Since it's sent via form-data, variants might be a stringified JSON array
                variants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : req.body.variants;
            } catch (err) {
                return res.status(400).json({ success: false, message: "Invalid variants format. Must be a JSON array." });
            }
        }

        if (!req.files || !req.files.mainImage || req.files.mainImage.length === 0) {
            return res.status(400).json({ success: false, message: "mainImage is required" });
        }

        const mainImage = req.files.mainImage[0].path; // Cloudinary URL
        const otherImages = req.files.otherImages ? req.files.otherImages.map(file => file.path) : [];

        // Validate Category
        let categoryId;
        if (mongoose.Types.ObjectId.isValid(category)) {
            categoryId = category;
        } else {
            const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, "i") } });
            if (!cat) return res.status(404).json({ success: false, message: "Category not found" });
            categoryId = cat._id;
        }

        // Validate SubCategory and check if it belongs to Category
        let subCategoryId;
        if (mongoose.Types.ObjectId.isValid(subCategory)) {
            subCategoryId = subCategory;
        } else {
            const subCat = await SubCategory.findOne({ name: { $regex: new RegExp(`^${subCategory}$`, "i") }, category: categoryId });
            if (!subCat) return res.status(404).json({ success: false, message: "SubCategory not found or doesn't belong to the specified category" });
            subCategoryId = subCat._id;
        }

        const validSubCategory = await SubCategory.findOne({ _id: subCategoryId, category: categoryId });
        if (!validSubCategory) {
            return res.status(400).json({ success: false, message: "SubCategory does not belong to the selected Category" });
        }

        // Generate slug
        let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        let slug = baseSlug;
        let slugExists = await Product.findOne({ slug });
        let counter = 1;
        while (slugExists) {
            slug = `${baseSlug}-${counter}`;
            slugExists = await Product.findOne({ slug });
            counter++;
        }

        const productId = await generateId("PRD");

        const product = await Product.create({
            productId,
            name,
            slug,
            category: categoryId,
            subCategory: subCategoryId,
            mrp,
            sellPrice,
            description,
            metaTitle,
            metaDescription,
            metaKeyword,
            mainImage,
            otherImages,
            variants
        });

        res.status(201).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Get all Products
// @route   GET /api/v1/public/products/list
// @access  Public
const getProducts = async (req, res, next) => {
    try {
        const { search, category, subCategory, status, page = 1, limit = 10 } = req.query;

        let filter = {};
        if (status) filter.status = status;
        
        if (search) {
            filter.$text = { $search: search };
        }

        // Handle category filter (ID or Name)
        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.category = category;
            } else {
                const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, "i") } });
                if (cat) filter.category = cat._id;
                else filter.category = null;
            }
        }

        // Handle subCategory filter (ID or Name)
        if (subCategory) {
            if (mongoose.Types.ObjectId.isValid(subCategory)) {
                filter.subCategory = subCategory;
            } else {
                const subCat = await SubCategory.findOne({ name: { $regex: new RegExp(`^${subCategory}$`, "i") } });
                if (subCat) filter.subCategory = subCat._id;
                else filter.subCategory = null;
            }
        }

        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);
        const skip = (pageNum - 1) * limitNum;

        const total = await Product.countDocuments(filter);
        
        let query = Product.find(filter)
            .populate("category", "name")
            .populate("subCategory", "name")
            .skip(skip)
            .limit(limitNum);
            
        if (search) {
            // Sort by text search score if searching
            query = query.sort({ score: { $meta: "textScore" } });
        } else {
            query = query.sort({ createdAt: -1 });
        }

        const products = await query.exec();

        res.status(200).json({
            success: true,
            data: products,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum),
                limit: limitNum
            }
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get Product Details
// @route   GET /api/v1/public/products/details/:identifier (ID or Slug)
// @access  Public
const getProductDetails = async (req, res, next) => {
    try {
        const { identifier } = req.params;
        
        let filter = {};
        if (mongoose.Types.ObjectId.isValid(identifier)) {
            filter = { _id: identifier };
        } else {
            filter = { slug: identifier };
        }

        const product = await Product.findOne(filter)
            .populate("category", "name")
            .populate("subCategory", "name");

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Update a Product
// @route   PATCH /api/v1/admin/products/update/:id
// @access  Private/Admin
const updateProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        const {
            name,
            category,
            subCategory,
            mrp,
            sellPrice,
            description,
            metaTitle,
            metaDescription,
            metaKeyword,
        } = req.body;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Handle category update
        if (category) {
            let categoryId;
            if (mongoose.Types.ObjectId.isValid(category)) {
                categoryId = category;
            } else {
                const cat = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, "i") } });
                if (!cat) return res.status(404).json({ success: false, message: "Category not found" });
                categoryId = cat._id;
            }
            product.category = categoryId;
        }

        // Handle subCategory update
        if (subCategory) {
            let subCategoryId;
            if (mongoose.Types.ObjectId.isValid(subCategory)) {
                subCategoryId = subCategory;
            } else {
                const subCat = await SubCategory.findOne({ name: { $regex: new RegExp(`^${subCategory}$`, "i") }, category: product.category });
                if (!subCat) return res.status(404).json({ success: false, message: "SubCategory not found or doesn't belong to the category" });
                subCategoryId = subCat._id;
            }
            
            const validSubCategory = await SubCategory.findOne({ _id: subCategoryId, category: product.category });
            if (!validSubCategory) {
                return res.status(400).json({ success: false, message: "SubCategory does not belong to the selected Category" });
            }
            product.subCategory = subCategoryId;
        }

        // Update basic fields
        if (name && name !== product.name) {
            product.name = name;
            // Generate new slug if name changes
            let baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            let slug = baseSlug;
            let slugExists = await Product.findOne({ slug, _id: { $ne: id } });
            let counter = 1;
            while (slugExists) {
                slug = `${baseSlug}-${counter}`;
                slugExists = await Product.findOne({ slug, _id: { $ne: id } });
                counter++;
            }
            product.slug = slug;
        }

        if (mrp) product.mrp = mrp;
        if (sellPrice) product.sellPrice = sellPrice;
        if (description) product.description = description;
        if (metaTitle) product.metaTitle = metaTitle;
        if (metaDescription) product.metaDescription = metaDescription;
        if (metaKeyword) product.metaKeyword = metaKeyword;

        // Handle variants
        if (req.body.variants) {
            try {
                product.variants = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : req.body.variants;
            } catch (err) {
                return res.status(400).json({ success: false, message: "Invalid variants format. Must be a JSON array." });
            }
        }

        // Handle File uploads
        if (req.files) {
            if (req.files.mainImage && req.files.mainImage.length > 0) {
                product.mainImage = req.files.mainImage[0].path;
            }
            
            if (req.files.otherImages && req.files.otherImages.length > 0) {
                const newOtherImages = req.files.otherImages.map(file => file.path);
                // Optionally append or replace. Here we append. 
                // A complete solution might allow deleting specific images via a separate array of IDs/URLs to remove.
                product.otherImages = [...product.otherImages, ...newOtherImages].slice(0, 5); // Limit to 5
            }
        }

        await product.save();

        res.status(200).json({ success: true, data: product });
    } catch (error) {
        next(error);
    }
};

// @desc    Change Product Status (Soft Delete)
// @route   PATCH /api/v1/admin/products/status/:id
// @access  Private/Admin
const changeProductStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!["ACTIVE", "INACTIVE"].includes(status)) {
            return res.status(400).json({ success: false, message: "Invalid status" });
        }

        const product = await Product.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.status(200).json({ success: true, data: product, message: `Product marked as ${status}` });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProduct,
    getProducts,
    getProductDetails,
    updateProduct,
    changeProductStatus
};
