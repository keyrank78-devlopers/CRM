const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        required: true,
        trim: true,
    },
    whatsappNumber: {
        type: String,
        trim: true,
    },
    address: {
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        locality: { type: String, trim: true },
        pincode: { type: String, trim: true },
        landmark: { type: String, trim: true },
    },
    status: {
        type: String,
        enum: [
            'New',
            'Cold',
            'Warm',
            'Hot',
            'Interested',
            'Not Interested',
            'Follow-up Required',
            'Callback',
            'No Response',
            'Wrong Number',
            'Future Requirement',
            'Converted',
            'Lost',
            'Visit'
        ],
        default: 'New',
    },
    source: {
        type: String,
        enum: ['Website', 'Direct', 'Meta Ads', 'Google Ads'],
        default: 'Direct',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
