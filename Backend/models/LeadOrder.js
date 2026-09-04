const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    actualPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    offerPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    quantity: {
        type: Number,
        required: true,
        default: 1,
        min: 1,
    },
    itemTotal: {
        type: Number,
        required: true,
        min: 0,
    }
}, { _id: false });

const leadOrderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true,
    },
    items: [itemSchema],
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
    },
    remark: {
        type: String,
        trim: true,
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

// Index for efficient search
leadOrderSchema.index({ lead: 1, createdBy: 1 });

module.exports = mongoose.model('LeadOrder', leadOrderSchema);
