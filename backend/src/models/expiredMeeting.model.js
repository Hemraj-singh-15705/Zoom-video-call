import mongoose, { Schema } from "mongoose";

const expiredMeetingSchema = new Schema({
    meetingCode: { type: String, required: true, unique: true },
    dateEnded: { type: Date, default: Date.now, required: true }
});

const ExpiredMeeting = mongoose.model("ExpiredMeeting", expiredMeetingSchema);

export { ExpiredMeeting };
