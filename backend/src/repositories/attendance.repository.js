const BaseRepository = require('./base.repository');
const Attendance = require('../models/Attendance');

class AttendanceRepository extends BaseRepository {
  constructor() {
    super(Attendance);
  }

  async findByClassAndDate(classId, subjectId, date, collegeId) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return Attendance.find({
      class: classId,
      subject: subjectId,
      collegeId,
      date: { $gte: start, $lte: end },
    })
      .populate({ path: 'student', select: 'studentId rollNumber', populate: { path: 'userId', select: 'name' } })
      .lean();
  }

  async findByStudent(studentId, collegeId, filters = {}) {
    const filter = { student: studentId, collegeId, ...filters };
    return Attendance.find(filter)
      .populate('subject', 'name code')
      .sort({ date: -1 })
      .lean();
  }

  async upsertAttendance(data) {
    const { student, subject, date } = data;
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return Attendance.findOneAndUpdate(
      {
        student,
        subject,
        date: { $gte: start, $lte: end },
      },
      data,
      { upsert: true, new: true, runValidators: true }
    );
  }

  async getAttendanceStats(collegeId, filter = {}) {
    return Attendance.aggregate([
      { $match: { collegeId, ...filter } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);
  }
}

module.exports = new AttendanceRepository();
