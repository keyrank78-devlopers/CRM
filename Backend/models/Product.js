const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
    {
        productId: {
            type: String,
            required: true,
            unique: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        category: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        subCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "SubCategory",
            required: true,
        },
        description: {
            type: String,
        },
        mrp: {
            type: Number,
            required: true,
            min: 0,
        },
        sellPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        mainImage: {
            type: String,
            required: true,
        },
        otherImages: [
            {
                type: String,
            },
        ],
        variants: [
            {
                key: { type: String, required: true },
                value: { type: String, required: true },
            },
        ],
        metaTitle: {
            type: String,
        },
        metaDescription: {
            type: String,
        },
        metaKeyword: {
            type: String,
        },
        status: {
            type: String,
            enum: ["ACTIVE", "INACTIVE"],
            default: "ACTIVE",
        },
    },
    { timestamps: true }
);

// Indexes for searching and filtering
productSchema.index({ name: "text", description: "text" });
productSchema.index({ category: 1, subCategory: 1 });

module.exports = mongoose.model("Product", productSchema);
