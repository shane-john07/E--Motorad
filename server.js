const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const app = express();
const Contact = require('./models/Contact.js');
app.use(express.json());

app.get("/", async (req, res) => {
    res.send("Test");
});

app.post('/identify', async (req, res) => {
    const { email, phoneNumber } = req.body;

    try {
        if (!email && !phoneNumber) {
            return res.status(400).json({ message: "Email or phone number must be provided." });
        }

        const existingContacts = await Contact.find({
            $or: [{ email }, { phoneNumber }],
            deletedAt: null
        });

        let primaryContact;

        // Check if any existing primary contact has a conflicting linkPrecedence
        if (existingContacts.length > 0) {
            const primaryContacts = existingContacts.filter(contact => contact.linkPrecedence === 'primary');
            
            if (primaryContacts.length > 1) {
                return res.status(500).json({ message: "Data inconsistency: multiple primary contacts found." });
            }
            
            primaryContact = primaryContacts[0] || existingContacts[0];
        }

        if (!primaryContact) {
            // create a new primary contact
            primaryContact = new Contact({ email, phoneNumber, linkPrecedence: "primary" });
            await primaryContact.save();
        } else {
            // Create a secondary contact
            const isNewInfo = !existingContacts.some(contact => contact.email === email && contact.phoneNumber === phoneNumber);
            
            if (isNewInfo) {
                const secondaryContact = new Contact({
                    email,
                    phoneNumber,
                    linkedId: primaryContact._id,
                    linkPrecedence: "secondary"
                });
                await secondaryContact.save();
            }
        }

        // Retrieve all linked contacts
        const allContacts = await Contact.find({
            $or: [
                { _id: primaryContact._id },
                { linkedId: primaryContact._id }
            ],
            deletedAt: null
        });

        const responsePayload = {
            primaryContactId: primaryContact._id,
            emails: [...new Set(allContacts.map(contact => contact.email))],
            phoneNumbers: [...new Set(allContacts.map(contact => contact.phoneNumber))],
            secondaryContactIds: allContacts
                .filter(contact => contact.linkPrecedence === "secondary")
                .map(contact => contact._id)
        };

        res.status(200).json(responsePayload);

    } catch (error) {
        console.error('Error processing /identify request:', error);
        if (error instanceof mongoose.Error.ValidationError) {
            res.status(400).json({ message: "Validation error: invalid data format" });
        } else {
            res.status(500).json({ message: "An unknown error occurred" });
        }
    }
});

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Database connected'))
    .catch(err => console.error('Database connection error', err));

app.listen(8080, () => {
    console.log('Server running on port 8080');
});