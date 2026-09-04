const Lead = require('../models/lead.model');

// Helper to check full access (Admin or Team Lead/Leader)
const checkFullAccess = (user) => {
    if (!user) return false;
    if (user.userType === 'ADMIN') return true;
    
    const roleUpper = user.role ? String(user.role).toUpperCase() : '';
    if (roleUpper === 'TEAM_LEAD' || roleUpper === 'TEAM_LEADER' || roleUpper === 'TL' || roleUpper === 'MANAGER') return true;

    const desigName = user.designation?.name ? String(user.designation.name).toLowerCase() : '';
    if (
        desigName.includes('team lead') || 
        desigName.includes('team leader') || 
        desigName.includes('tl') || 
        desigName.includes('manager') ||
        desigName.includes('head')
    ) {
        return true;
    }

    return false;
};

// Create Lead
exports.createLead = async (req, res) => {
    try {
        const { name, email, phone, whatsappNumber, address, status, source, assignedTo } = req.body;
        const newLead = new Lead({
            name,
            email,
            phone,
            whatsappNumber,
            address,
            status,
            source,
            assignedTo: assignedTo || null,
            createdBy: req.user?._id // assuming req.user is set by auth middleware
        });
        await newLead.save();
        res.status(201).json({ success: true, message: 'Lead created successfully', data: newLead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Leads with Pagination and Filters
exports.getLeads = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        // Visibility Rule: If NOT Admin and NOT Team Lead, user only sees leads created by or assigned to them
        if (!checkFullAccess(req.user)) {
            query.$or = [
                { createdBy: req.user._id },
                { assignedTo: req.user._id }
            ];
        }

        // Search Filter
        if (req.query.search) {
            const searchRegex = { $regex: req.query.search, $options: 'i' };
            const searchCondition = [
                { name: searchRegex },
                { email: searchRegex },
                { phone: searchRegex }
            ];

            if (query.$or) {
                // Combine with existing $or
                query.$and = [
                    { $or: query.$or },
                    { $or: searchCondition }
                ];
                delete query.$or;
            } else {
                query.$or = searchCondition;
            }
        }

        // Status Filter
        if (req.query.status) {
            query.status = req.query.status;
        }

        const leads = await Lead.find(query)
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Lead.countDocuments(query);

        res.status(200).json({ 
            success: true, 
            data: leads,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Single Lead
exports.getLeadById = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (!checkFullAccess(req.user)) {
            query.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
        }

        const lead = await Lead.findOne(query)
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .lean();
        if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
        res.status(200).json({ success: true, data: lead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Lead
exports.updateLead = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (!checkFullAccess(req.user)) {
            query.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
        }

        const updatedLead = await Lead.findOneAndUpdate(
            query,
            req.body,
            { returnDocument: 'after', runValidators: true }
        )
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .populate({
                path: 'assignedTo',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .lean();
        
        if (!updatedLead) return res.status(404).json({ success: false, message: 'Lead not found or unauthorized' });
        res.status(200).json({ success: true, message: 'Lead updated successfully', data: updatedLead });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Assign Lead(s) (Single or Bulk) - Only Admin or Team Lead
exports.assignLeads = async (req, res) => {
    try {
        if (!checkFullAccess(req.user)) {
            return res.status(403).json({ success: false, message: 'Only Admin or Team Lead can assign leads' });
        }

        const { leadIds, assignedTo } = req.body;
        
        if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Please provide array of leadIds' });
        }
        if (!assignedTo) {
            return res.status(400).json({ success: false, message: 'Please select a salesperson/employee to assign' });
        }

        const result = await Lead.updateMany(
            { _id: { $in: leadIds } },
            { $set: { assignedTo } }
        );

        res.status(200).json({ 
            success: true, 
            message: `Successfully assigned ${result.modifiedCount} lead(s)`,
            data: result 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Lead
exports.deleteLead = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (!checkFullAccess(req.user)) {
            query.$or = [{ createdBy: req.user._id }, { assignedTo: req.user._id }];
        }

        const deletedLead = await Lead.findOneAndDelete(query);
        if (!deletedLead) return res.status(404).json({ success: false, message: 'Lead not found or unauthorized' });
        res.status(200).json({ success: true, message: 'Lead deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
