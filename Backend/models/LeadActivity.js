const mongoose = require('mongoose');

const leadActivitySchema = new mongoose.Schema({
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lead',
        required: true,
    },
    callDuration: {
        type: String, // Manual duration input e.g. "5 mins", "02:30", "15 mins"
        trim: true,
    },
    callDate: {
        type: Date,
        default: Date.now,
    },
    remarks: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String, // Status set during this activity
    },
    followUpDate: {
        type: Date,
    },
    followUpTime: {
        type: String, // Format "HH:mm" e.g. "14:30"
    },
    followUpNote: {
        type: String,
        trim: true,
    },
    followUpStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Cancelled'],
        default: 'Pending',
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model('LeadActivity', leadActivitySchema);
