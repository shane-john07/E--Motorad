const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    email: { 
        type: String, 
        unique: false, 
        sparse: true 
    },
    phoneNumber: { 
        type: String,
        unique: false, 
        sparse: true 
    },
    linkedId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Contact', 
        default: null 
    },
    linkPrecedence: { 
        type: String, 
        enum: ['primary', 'secondary'], 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    updatedAt: { 
        type: Date, 
        default: Date.now 
    },
    deletedAt: { 
        type: Date, 
        default: null 
    }
});

const Contact = mongoose.model('Contact', contactSchema);
module.exports = Contact;