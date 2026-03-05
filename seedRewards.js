const mongoose = require("mongoose");
const Reward = require("./models/Reward");
require("dotenv").config();

const rewards = [
    {
        title: "Eco Badge",
        description: "Earned for basic participation in waste disposal.",
        pointsRequired: 100,
        rewardType: "badge"
    },
    {
        title: "Green Warrior",
        description: "Recognized as a dedicated waste management citizen.",
        pointsRequired: 300,
        rewardType: "badge"
    },
    {
        title: "Free Compost Kit",
        description: "Get a free home composting kit to handle organic waste.",
        pointsRequired: 500,
        rewardType: "item"
    },
    {
        title: "Community Leader Certificate",
        description: "A digital certificate recognizing your leadership in community eco-activities.",
        pointsRequired: 1000,
        rewardType: "certificate"
    }
];

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB for seeding");
        await Reward.deleteMany({});
        await Reward.insertMany(rewards);
        console.log("Rewards seeded successfully!");
        process.exit();
    })
    .catch(err => {
        console.error("Seeding failed", err);
        process.exit(1);
    });
