const Attendance = require('../models/Attendance');
const Subject = require('../models/Subject');

/**
 * Calculate attendance percentage for a student per subject.
 * @param {ObjectId} studentId
 * @param {ObjectId} collegeId
 * @param {Object} filters - Optional { subjectId, startDate, endDate }
 */
const calculateAttendanceSummary = async (studentId, collegeId, filters = {}) => {
  const matchQuery = {
    student: studentId,
    collegeId,
  };

  if (filters.subjectId) {
    matchQuery.subject = filters.subjectId;
  }

  if (filters.startDate || filters.endDate) {
    matchQuery.date = {};
    if (filters.startDate) matchQuery.date.$gte = new Date(filters.startDate);
    if (filters.endDate) matchQuery.date.$lte = new Date(filters.endDate);
  }

  const summary = await Attendance.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$subject',
        totalClasses: { $sum: 1 },
        presentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'PRESENT'] }, 1, 0] },
        },
        absentCount: {
          $sum: { $cond: [{ $eq: ['$status', 'ABSENT'] }, 1, 0] },
        },
        lateCount: {
          $sum: { $cond: [{ $eq: ['$status', 'LATE'] }, 1, 0] },
        },
      },
    },
    {
      $lookup: {
        from: 'subjects',
        localField: '_id',
        foreignField: '_id',
        as: 'subject',
      },
    },
    { $unwind: { path: '$subject', preserveNullAndEmpty: true } },
    {
      $project: {
        subjectId: '$_id',
        subjectName: '$subject.name',
        subjectCode: '$subject.code',
        totalClasses: 1,
        presentCount: 1,
        absentCount: 1,
        lateCount: 1,
        attendancePercentage: {
          $round: [
            {
              $multiply: [
                { $divide: ['$presentCount', '$totalClasses'] },
                100,
              ],
            },
            2,
          ],
        },
      },
    },
    { $sort: { subjectName: 1 } },
  ]);

  const totalClasses = summary.reduce((sum, s) => sum + s.totalClasses, 0);
  const totalPresent = summary.reduce((sum, s) => sum + s.presentCount, 0);
  const overallPercentage =
    totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100 * 100) / 100 : 0;

  return {
    subjects: summary,
    overall: {
      totalClasses,
      totalPresent,
      totalAbsent: summary.reduce((sum, s) => sum + s.absentCount, 0),
      totalLate: summary.reduce((sum, s) => sum + s.lateCount, 0),
      attendancePercentage: overallPercentage,
    },
  };
};

/**
 * Get attendance records for a class on a specific date.
 */
const getClassAttendanceByDate = async (classId, subjectId, date, collegeId) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  return Attendance.find({
    collegeId,
    class: classId,
    subject: subjectId,
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate('student', 'studentId rollNumber')
    .populate('student.userId', 'name')
    .lean();
};

/**
 * Bulk mark attendance for an entire class.
 * @param {Array} records - Array of { studentId, status }
 * @param {Object} meta - { classId, subjectId, collegeId, date, markedBy }
 */
const bulkMarkAttendance = async (records, meta) => {
  const { classId, subjectId, collegeId, date, markedBy } = meta;

  const attendanceDate = new Date(date);
  attendanceDate.setHours(12, 0, 0, 0); // Normalize to noon

  const operations = records.map((record) => ({
    updateOne: {
      filter: {
        student: record.studentId,
        subject: subjectId,
        date: {
          $gte: new Date(attendanceDate.toDateString()),
          $lt: new Date(new Date(attendanceDate).setDate(attendanceDate.getDate() + 1)),
        },
      },
      update: {
        $set: {
          student: record.studentId,
          class: classId,
          subject: subjectId,
          collegeId,
          date: attendanceDate,
          status: record.status,
          markedBy,
        },
      },
      upsert: true,
    },
  }));

  const result = await Attendance.bulkWrite(operations);
  return result;
};

module.exports = {
  calculateAttendanceSummary,
  getClassAttendanceByDate,
  bulkMarkAttendance,
};
