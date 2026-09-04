const LeadOrder = require('../models/LeadOrder');
const Lead = require('../models/lead.model');
const Product = require('../models/Product');
const generateId = require('../utils/generateId');

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

// Create Lead Order with Multi-Products
exports.createLeadOrder = async (req, res) => {
    try {
        const { leadId, items, remark } = req.body;

        if (!leadId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'leadId and at least one item are required'
            });
        }

        const lead = await Lead.findById(leadId).lean();
        if (!lead) {
            return res.status(404).json({ success: false, message: 'Lead not found' });
        }

        const orderItems = [];
        let grandTotal = 0;

        for (const item of items) {
            const { productId, offerPrice, quantity = 1 } = item;
            if (!productId || offerPrice === undefined) {
                return res.status(400).json({ success: false, message: 'Each item must have a productId and offerPrice' });
            }

            const product = await Product.findById(productId).lean();
            if (!product) {
                return res.status(404).json({ success: false, message: `Product with ID ${productId} not found` });
            }

            const actualPrice = product.sellPrice || product.mrp || 0;
            const parsedOfferPrice = parseFloat(offerPrice);
            const parsedQuantity = parseInt(quantity) || 1;
            const itemTotal = parsedOfferPrice * parsedQuantity;

            grandTotal += itemTotal;

            orderItems.push({
                product: productId,
                actualPrice,
                offerPrice: parsedOfferPrice,
                quantity: parsedQuantity,
                itemTotal
            });
        }

        // Generate unique orderId in ORD-000001 format
        const orderId = await generateId("ORD");

        const newOrder = new LeadOrder({
            orderId,
            lead: leadId,
            items: orderItems,
            totalAmount: grandTotal,
            remark,
            createdBy: req.user._id
        });

        await newOrder.save();

        const populatedOrder = await LeadOrder.findById(newOrder._id)
            .populate('lead', 'name email phone address')
            .populate('items.product', 'name productId mrp sellPrice mainImage')
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .lean();

        res.status(201).json({
            success: true,
            message: 'Lead order created successfully',
            data: populatedOrder
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get All Lead Orders with Pagination and Filters (1+N query safe)
exports.getLeadOrders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = {};

        // Restricted access if NOT Admin or Team Lead
        if (!checkFullAccess(req.user)) {
            if (req.query.leadId) {
                const leadDoc = await Lead.findOne({
                    _id: req.query.leadId,
                    $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }]
                }).lean();
                if (!leadDoc) {
                    return res.status(200).json({
                        success: true,
                        data: [],
                        pagination: { total: 0, page: 1, pages: 0 }
                    });
                }
                query.lead = req.query.leadId;
            } else {
                query.createdBy = req.user._id;
            }
        } else if (req.query.leadId) {
            query.lead = req.query.leadId;
        }

        // Filter by Status if provided
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Search Filter (by Order ID)
        if (req.query.search) {
            query.orderId = { $regex: req.query.search, $options: 'i' };
        }

        // Single populated pipeline (No 1+N queries)
        const orders = await LeadOrder.find(query)
            .populate('lead', 'name email phone address')
            .populate('items.product', 'name productId mrp sellPrice mainImage')
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await LeadOrder.countDocuments(query);

        res.status(200).json({
            success: true,
            data: orders,
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

// Get Single Lead Order by ID
exports.getLeadOrderById = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (!checkFullAccess(req.user)) {
            query.createdBy = req.user._id;
        }

        const order = await LeadOrder.findOne(query)
            .populate('lead', 'name email phone address')
            .populate('items.product', 'name productId mrp sellPrice mainImage')
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .lean();

        if (!order) {
            return res.status(404).json({ success: false, message: 'Lead order not found' });
        }

        res.status(200).json({ success: true, data: order });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Update Lead Order (Status / Remark / Items)
exports.updateLeadOrder = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (!checkFullAccess(req.user)) {
            query.createdBy = req.user._id;
        }

        const { items, remark, status } = req.body;
        const updateFields = {};

        if (remark !== undefined) updateFields.remark = remark;
        if (status !== undefined) updateFields.status = status;

        if (items && Array.isArray(items) && items.length > 0) {
            const orderItems = [];
            let grandTotal = 0;

            for (const item of items) {
                const { productId, offerPrice, quantity = 1 } = item;
                const product = await Product.findById(productId).lean();
                const actualPrice = product ? (product.sellPrice || product.mrp || 0) : 0;
                const parsedOfferPrice = parseFloat(offerPrice || 0);
                const parsedQuantity = parseInt(quantity) || 1;
                const itemTotal = parsedOfferPrice * parsedQuantity;
                grandTotal += itemTotal;

                orderItems.push({
                    product: productId,
                    actualPrice,
                    offerPrice: parsedOfferPrice,
                    quantity: parsedQuantity,
                    itemTotal
                });
            }
            updateFields.items = orderItems;
            updateFields.totalAmount = grandTotal;
        }

        const updatedOrder = await LeadOrder.findOneAndUpdate(
            query,
            updateFields,
            { returnDocument: 'after', runValidators: true }
        )
            .populate('lead', 'name email phone address')
            .populate('items.product', 'name productId mrp sellPrice mainImage')
            .populate({
                path: 'createdBy',
                select: 'name email userType role designation',
                populate: { path: 'designation', select: 'name' }
            })
            .lean();

        if (!updatedOrder) {
            return res.status(404).json({ success: false, message: 'Lead order not found or unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Lead order updated successfully', data: updatedOrder });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete Lead Order
exports.deleteLeadOrder = async (req, res) => {
    try {
        const query = { _id: req.params.id };
        if (!checkFullAccess(req.user)) {
            query.createdBy = req.user._id;
        }

        const deletedOrder = await LeadOrder.findOneAndDelete(query);
        if (!deletedOrder) {
            return res.status(404).json({ success: false, message: 'Lead order not found or unauthorized' });
        }

        res.status(200).json({ success: true, message: 'Lead order deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
