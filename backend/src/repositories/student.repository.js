const BaseRepository = require('./base.repository');
const Student = require('../models/Student');

class StudentRepository extends BaseRepository {
  constructor() {
    super(Student);
  }

  async findByCollegeId(collegeId, filters = {}, queryParams = {}) {
    const filter = { collegeId, isActive: true, ...filters };
    return this.findPaginated(filter, queryParams, {
      populate: [
        { path: 'userId', select: 'name email avatar' },
        { path: 'department', select: 'name code' },
        { path: 'class', select: 'name section year semester' },
      ],
      sort: { createdAt: -1 },
    });
  }

  async findByIdAndCollege(id, collegeId) {
    return Student.findOne({ _id: id, collegeId })
      .populate('userId', 'name email avatar')
      .populate('department', 'name code')
      .populate('class', 'name section year semester')
      .lean();
  }

  async findByStudentId(studentId, collegeId) {
    return Student.findOne({ studentId, collegeId }).lean();
  }

  async countActiveByCollege(collegeId) {
    return Student.countDocuments({ collegeId, isActive: true });
  }

  async searchStudents(collegeId, searchTerm, filters = {}) {
    const userIds = await require('../models/User').User
      .find({ name: { $regex: searchTerm, $options: 'i' }, collegeId })
      .select('_id')
      .lean();

    const filter = {
      collegeId,
      isActive: true,
      ...filters,
      $or: [
        { userId: { $in: userIds.map((u) => u._id) } },
        { studentId: { $regex: searchTerm, $options: 'i' } },
        { rollNumber: { $regex: searchTerm, $options: 'i' } },
      ],
    };

    return Student.find(filter)
      .populate('userId', 'name email')
      .populate('department', 'name code')
      .populate('class', 'name section')
      .lean();
  }
}

module.exports = new StudentRepository();
