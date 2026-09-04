const LeadActivity = require('../models/LeadActivity');
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

// Create Activity Log (Call Log & Follow-up)
exports.createActivity = async (req, res) => {
    try {
        const { leadId, callDuration, callDate, remarks, status, followUpDate, followUpTime, followUpNote } = req.body;

        if (!leadId) {
            return res.status(400).json({ success: false, message: 'leadId is required' });
        }
        if (!remarks) {
            return res.status(400).json({ success: false, message: 'Discussion remarks are required' });
        }

        const lead = await Lead.findById(leadId);
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        // Create Activity
        const activity = new LeadActivity({
            lead: leadId,
            callDuration: callDuration || '',
            callDate: callDate || new Date(),
            remarks,
            status: status || lead.status,
            followUpDate: followUpDate || null,
            followUpTime: followUpTime || '',
            followUpNote: followUpNote || '',
            followUpStatus: followUpDate ? 'Pending' : undefined,
            createdBy: req.user._id
        });

        await activity.save();

        // Update lead status if status is provided and changed
        if (status && status !== lead.status) {
            lead.status = status;
            await lead.save();
        }

        const populatedActivity = await LeadActivity.findById(activity._id)
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .lean();

        res.status(201).json({
            success: true,
            message: 'Call log saved successfully',
            data: populatedActivity
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Activities (Timeline) for a Lead
exports.getLeadActivities = async (req, res) => {
    try {
        const { leadId } = req.params;

        const activities = await LeadActivity.find({ lead: leadId })
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            data: activities
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get Pending/Today's Follow-ups
exports.getFollowUps = async (req, res) => {
    try {
        const query = {
            followUpDate: { $ne: null }
        };

        // Filter by user if not full access
        if (!checkFullAccess(req.user)) {
            query.createdBy = req.user._id;
        }

        const filter = req.query.filter; // 'today', 'upcoming', 'overdue'
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (filter === 'today') {
            query.followUpDate = { $gte: today, $lt: tomorrow };
        } else if (filter === 'overdue') {
            query.followUpDate = { $lt: today };
            query.followUpStatus = 'Pending';
        } else if (filter === 'upcoming') {
            query.followUpDate = { $gte: tomorrow };
        }

        const followUps = await LeadActivity.find(query)
            .populate('lead', 'name phone email status address')
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .sort({ followUpDate: 1 })
            .lean();

        res.status(200).json({
            success: true,
            data: followUps
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Activity Log
exports.updateActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { callDuration, remarks, status, followUpDate, followUpTime, followUpNote, followUpStatus } = req.body;

        const activity = await LeadActivity.findById(id);
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity record not found' });
        }

        // Permission check: Admin, Team Lead, OR creator of activity
        if (!checkFullAccess(req.user) && String(activity.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Unauthorized to update this call log' });
        }

        if (callDuration !== undefined) activity.callDuration = callDuration;
        if (remarks !== undefined) activity.remarks = remarks;
        if (status !== undefined) activity.status = status;
        if (followUpDate !== undefined) activity.followUpDate = followUpDate || null;
        if (followUpTime !== undefined) activity.followUpTime = followUpTime;
        if (followUpNote !== undefined) activity.followUpNote = followUpNote;
        if (followUpStatus !== undefined) activity.followUpStatus = followUpStatus;

        await activity.save();

        // Also update lead's main status if updated here
        if (status) {
            await Lead.findByIdAndUpdate(activity.lead, { status });
        }

        const updatedActivity = await LeadActivity.findById(id)
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .lean();

        res.status(200).json({
            success: true,
            message: 'Call log updated successfully',
            data: updatedActivity
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Activity Log
exports.deleteActivity = async (req, res) => {
    try {
        const { id } = req.params;

        const activity = await LeadActivity.findById(id);
        if (!activity) {
            return res.status(404).json({ success: false, message: 'Activity record not found' });
        }

        // Permission check: Admin, Team Lead, OR creator of activity
        if (!checkFullAccess(req.user) && String(activity.createdBy) !== String(req.user._id)) {
            return res.status(403).json({ success: false, message: 'Unauthorized to delete this call log' });
        }

        await LeadActivity.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'Call log deleted successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
