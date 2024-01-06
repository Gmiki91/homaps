import express, { json } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
const app = express();

app.use(json({ limit: '50kb' }));
const corsOptions = {
    origin: 'http://localhost:1420',
    optionsSuccessStatus: 200 
}
app.use(cors(corsOptions));

const eventSchema = mongoose.Schema({
    fullDate: Number,
    dayOfYear: Number,
    note: String,
    qty: Number,
}, { collection: 'events' });
const Event = mongoose.model('Event', eventSchema);

const habitSchema = mongoose.Schema({
    title: String,
    color: String,
    freq: String,
    events: [eventSchema],
    measure: Boolean,
    unit: String,
    highestQty: Number
}, { collection: 'habits' });
const Habit = mongoose.model('Habit', habitSchema);

app.post('/', async (req, res) => {
    const habit = await Habit.create({
        title: req.body.title,
        color: req.body.color,
        freq: req.body.freq,
        events: [],
        measure: req.body.measure,
        unit: req.body.unit,
        highestQty: 1
    });
    res.status(200).json({
        status: 'success',
        data: habit
    })
})

app.post('/:id', async (req, res) => {
    const habit = await Habit.findById(new mongoose.Types.ObjectId(req.params.id));
    const event = req.body;
    if (habit) {
        habit.events.push(req.body);
        if (habit.highestQty < event.qty)
            habit.highestQty = event.qty;
        await habit.save();
    }
    res.status(200).json({
        status: 'success',
        data: habit
    })
})

app.get('/', async (req, res) => {
    const habits = await Habit.find();
    res.status(200).json({
        status: 'success',
        result: habits
    })
})
mongoose.connect('mongodb://127.0.0.1:27017/homap').then(() => console.log("Connected to database!"));
const server = app.listen(4040, () => console.log(`Express server listening on port 4040`));

